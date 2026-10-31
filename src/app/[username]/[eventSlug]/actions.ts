// src/app/[username]/[eventSlug]/actions.ts
"use server";

import { db } from "@/db";
import { hosts, eventTypes, availabilityRules, dateOverrides, bookings } from "@/db/schema";
import { eq, and, gte, lte } from "drizzle-orm";
import { generateSlots } from "@/lib/availability";
import { getTodayInTimezone } from "@/lib/time";
import { generateDerivedToken } from "@/lib/tokens";
import { computeBlockedRange, isSlotInGenerated } from "@/lib/booking";
import { bookingRequestSchema } from "@/lib/schemas";
import { buildGuestConfirmation, buildHostConfirmation } from "@/lib/email/templates";
import { sendTrackedEmail } from "@/lib/email/events";
import { after } from "next/server";
import { clerkClient } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { randomUUID } from "node:crypto";

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
  const parsed = bookingRequestSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Invalid input. Please check your details.", code: "validation_failed" };
  }

  // 1. Turnstile verification first, before any DB work.
  const siteVerifyForm = new URLSearchParams();
  siteVerifyForm.append("secret", process.env.TURNSTILE_SECRET_KEY || "");
  siteVerifyForm.append("response", input.turnstileToken);
  const turnstileRes = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
    method: "POST",
    body: siteVerifyForm,
  });
  const turnstileData = await turnstileRes.json();
  if (!turnstileData.success) {
    return { ok: false, error: "Verification failed. Please try again.", code: "turnstile_failed" };
  }

  // 2. Resolve host and event type.
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

  // 3. Re-generate slots at the server boundary.
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

  if (!isSlotInGenerated(input.requestedStartTime, validSlots)) {
    return { ok: false, error: "That time is no longer available. Please pick another.", code: "slot_taken" };
  }

  // 4. Compute range and derive the deterministic token from a fresh booking id.
  const requestedDate = new Date(input.requestedStartTime);
  const range = computeBlockedRange({
    start: requestedDate,
    durationMinutes: eventType.durationMinutes,
    bufferBeforeMinutes: eventType.bufferBeforeMinutes,
    bufferAfterMinutes: eventType.bufferAfterMinutes,
  });

  const bookingId = randomUUID();
  const { token, hash } = generateDerivedToken(bookingId);

  // 5. Insert. A 23P01 means someone else won the race.
  try {
    await db.insert(bookings).values({
      id: bookingId,
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
      sequence: 0,
    });
  } catch (error: unknown) {
    const err = error as { code?: string; cause?: { code?: string } };
    const code = err.code || err.cause?.code;
    if (code === "23P01") {
      return { ok: false, error: "That time was just taken. Please pick another.", code: "slot_taken" };
    }
    return { ok: false, error: "Something went wrong. Please try again.", code: "generic" };
  }

  // 6. Send confirmation emails after the response is sent.
  //    Capture everything the callback needs BEFORE calling after(). Do not read cookies
  //    or headers inside it. Individual failures update email_events; they never throw
  //    into the user's request.
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  const manageUrl = `${appUrl}/booking/${token}`;
  const hostClerkId = host.clerkUserId;

  after(async () => {
    try {
      // Guest confirmation
      const guestContent = buildGuestConfirmation({
        eventTitle: eventType.title,
        hostDisplayName: host.displayName,
        guestName: input.guestName,
        guestEmail: input.guestEmail,
        guestTimezone: input.guestTimezone,
        startTime: range.start,
        endTime: range.end,
        durationMinutes: eventType.durationMinutes,
        notes: input.notes || null,
        manageUrl,
      });
      await sendTrackedEmail({
        bookingId,
        sequence: 0,
        kind: "confirmed",
        role: "guest",
        to: [{ email: input.guestEmail, name: input.guestName }],
        subject: guestContent.subject,
        html: guestContent.html,
        text: guestContent.text,
        // No replyTo on guest emails. Host email must never appear here.
      });

      // Host confirmation (skip if we can't resolve the host's email from Clerk)
      const client = await clerkClient();
      const user = await client.users.getUser(hostClerkId);
      const hostEmail = user.primaryEmailAddress?.emailAddress;
      if (hostEmail) {
        const hostContent = buildHostConfirmation({
          eventTitle: eventType.title,
          hostDisplayName: host.displayName,
          hostTimezone: host.timezone,
          guestName: input.guestName,
          guestEmail: input.guestEmail,
          startTime: range.start,
          endTime: range.end,
          durationMinutes: eventType.durationMinutes,
          notes: input.notes || null,
        });
        await sendTrackedEmail({
          bookingId,
          sequence: 0,
          kind: "confirmed",
          role: "host",
          to: [{ email: hostEmail, name: host.displayName }],
          subject: hostContent.subject,
          html: hostContent.html,
          text: hostContent.text,
          replyTo: { email: input.guestEmail, name: input.guestName },
        });
      }
    } catch {
      // Individual failures are already recorded in email_events by sendTrackedEmail.
      // Never throw into the user's request from after().
    }
  });

  // 7. Redirect must be outside try/catch (redirect throws internally).
  redirect(`/booking/${token}`);
}