// src/app/[username]/[eventSlug]/actions.ts
"use server";

import { db } from "@/db";
import { hosts, eventTypes, availabilityRules, dateOverrides, bookings } from "@/db/schema";
import { eq, and, gte, lte } from "drizzle-orm";
import { generateSlots } from "@/lib/availability";
import { getTodayInTimezone } from "@/lib/time";
import { generateToken } from "@/lib/tokens";
import { computeBlockedRange, isSlotInGenerated } from "@/lib/booking";
import { bookingRequestSchema } from "@/lib/schemas";
import { redirect } from "next/navigation";

export type BookingActionResult =
  | { ok: true }
  | { ok: false; error: string; code?: "slot_taken" | "turnstile_failed" | "validation_failed" | "generic" };

export async function createBooking(input: {
  hostUsername: string;
  eventSlug: string;
  requestedStartTime: string;
  guestName: string;
  guestEmail: string;
  guestTimezone: string;
  notes?: string | null;
  turnstileToken: string;
}): Promise<BookingActionResult> {
  // 1. Zod Validation
  const parsed = bookingRequestSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Invalid input. Please check your details.", code: "validation_failed" };
  }

  // 2. Turnstile Verification (Before any DB work)
  const siteVerifyForm = new URLSearchParams();
  siteVerifyForm.append("secret", process.env.TURNSTILE_SECRET_KEY || "1x0000000000000000000000000000000AA");
  siteVerifyForm.append("response", input.turnstileToken);

  const turnstileRes = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
    method: "POST",
    body: siteVerifyForm,
  });
  const turnstileData = await turnstileRes.json();

  if (!turnstileData.success) {
    return { ok: false, error: "Verification failed. Please try again.", code: "turnstile_failed" };
  }

  // 3. Resolve Host and Event Type
  const hostResult = await db
    .select()
    .from(hosts)
    .where(eq(hosts.username, input.hostUsername.toLowerCase()))
    .limit(1);
  const host = hostResult[0];
  if (!host) return { ok: false, error: "Event type not found.", code: "validation_failed" };

  const eventTypeResult = await db
    .select()
    .from(eventTypes)
    .where(and(eq(eventTypes.hostId, host.id), eq(eventTypes.slug, input.eventSlug), eq(eventTypes.isActive, true)))
    .limit(1);
  const eventType = eventTypeResult[0];
  if (!eventType) return { ok: false, error: "Event type not found.", code: "validation_failed" };

  // 4. Re-generate Slots
  const rules = await db.select().from(availabilityRules).where(eq(availabilityRules.hostId, host.id));
  const todayStr = getTodayInTimezone(host.timezone);
  const overrides = await db
    .select()
    .from(dateOverrides)
    .where(and(eq(dateOverrides.hostId, host.id), gte(dateOverrides.date, todayStr)));

  const now = new Date();
  const rangeEnd = new Date(now.getTime() + eventType.maxDaysAhead * 24 * 60 * 60 * 1000);
  
  const existingBookings = await db
    .select()
    .from(bookings)
    .where(
      and(
        eq(bookings.hostId, host.id),
        eq(bookings.isCancelled, false),
        gte(bookings.blockedEnd, now),
        lte(bookings.blockedStart, rangeEnd)
      )
    );

  const validSlots = generateSlots({
    eventType: {
      durationMinutes: eventType.durationMinutes,
      slotIntervalMinutes: eventType.slotIntervalMinutes,
      bufferBeforeMinutes: eventType.bufferBeforeMinutes,
      bufferAfterMinutes: eventType.bufferAfterMinutes,
      minNoticeMinutes: eventType.minNoticeMinutes,
      maxDaysAhead: eventType.maxDaysAhead,
    },
    availabilityRules: rules,
    overrides,
    existingBookings,
    hostTimezone: host.timezone,
    guestTimezone: input.guestTimezone,
    now,
  });

  // 5. Verify Requested Start
  if (!isSlotInGenerated(input.requestedStartTime, validSlots)) {
    return { ok: false, error: "That time is no longer available. Please pick another.", code: "slot_taken" };
  }

  // 6. Compute Blocked Range
  const requestedDate = new Date(input.requestedStartTime);
  const range = computeBlockedRange({
    start: requestedDate,
    durationMinutes: eventType.durationMinutes,
    bufferBeforeMinutes: eventType.bufferBeforeMinutes,
    bufferAfterMinutes: eventType.bufferAfterMinutes,
  });

  // 7. Generate Token
  const { token, hash } = generateToken();

  // 8. Insert Booking
  try {
    await db.insert(bookings).values({
      eventTypeId: eventType.id,
      hostId: host.id,
      guestName: input.guestName,
      guestEmail: input.guestEmail,
      guestTimezone: input.guestTimezone,
      notes: input.notes || null,
      startTime: range.start,
      endTime: range.end,
      eventTitleSnapshot: eventType.title,
      bufferBeforeMinutes: eventType.bufferBeforeMinutes,
      bufferAfterMinutes: eventType.bufferAfterMinutes,
      blockedStart: range.blockedStart,
      blockedEnd: range.blockedEnd,
      manageTokenHash: hash,
    });
  } catch (error: unknown) {
    const err = error as { code?: string; cause?: { code?: string } };
    const code = err.code || err.cause?.code;

    // Exclusion constraint violation (double booking)
    if (code === "23P01") {
      return { ok: false, error: "That time was just taken. Please pick another.", code: "slot_taken" };
    }
    
    // Unique constraint violation on token (extremely rare, but possible)
    if (code === "23505") {
      // Retry once with a new token
      const retry = generateToken();
      try {
        await db.insert(bookings).values({
          eventTypeId: eventType.id,
          hostId: host.id,
          guestName: input.guestName,
          guestEmail: input.guestEmail,
          guestTimezone: input.guestTimezone,
          notes: input.notes || null,
          startTime: range.start,
          endTime: range.end,
          eventTitleSnapshot: eventType.title,
          bufferBeforeMinutes: eventType.bufferBeforeMinutes,
          bufferAfterMinutes: eventType.bufferAfterMinutes,
          blockedStart: range.blockedStart,
          blockedEnd: range.blockedEnd,
          manageTokenHash: retry.hash,
        });
        // If retry succeeds, redirect using the retry token
        // PHASE 5 NOTE: The raw token only exists here. Send the email in this same request.
        redirect(`/booking/${retry.token}`);
      } catch {
        return { ok: false, error: "Something went wrong. Please try again.", code: "generic" };
      }
    }

    return { ok: false, error: "Something went wrong. Please try again.", code: "generic" };
  }

  // PHASE 5 NOTE: The raw token only exists here. Send the email in this same request.
  
  // Must be outside try/catch because redirect() throws internally
  redirect(`/booking/${token}`);
}