// src/app/booking/[token]/reschedule/actions.ts
"use server";

import { db } from "@/db";
import { bookings, hosts, eventTypes, availabilityRules, dateOverrides } from "@/db/schema";
import { eq, and, gte, lte, ne } from "drizzle-orm";
import { isValidTokenFormat, hashToken } from "@/lib/tokens";
import { generateSlots } from "@/lib/availability";
import { getTodayInTimezone } from "@/lib/time";
import { isSlotInGenerated, computeBlockedRange } from "@/lib/booking";
import { redirect } from "next/navigation";
import { after } from "next/server";
import { clerkClient } from "@clerk/nextjs/server";
import { buildRescheduledGuestEmail, buildRescheduledHostEmail } from "@/lib/email/templates";
import { sendTrackedEmail } from "@/lib/email/events";

export type RescheduleState = {
  error?: string;
};

export async function rescheduleBooking(
  prevState: RescheduleState,
  formData: FormData
): Promise<RescheduleState> {
  const token = formData.get("token") as string;
  const newStart = formData.get("requestedStartTime") as string;

  if (!isValidTokenFormat(token) || !newStart) {
    return { error: "Invalid request" };
  }

  const hash = hashToken(token);
  const bookingResult = await db
    .select({ booking: bookings, host: hosts, eventType: eventTypes })
    .from(bookings)
    .innerJoin(hosts, eq(bookings.hostId, hosts.id))
    .innerJoin(eventTypes, eq(bookings.eventTypeId, eventTypes.id))
    .where(eq(bookings.manageTokenHash, hash))
    .limit(1);

  const data = bookingResult[0];
  if (!data) return { error: "Booking not found" };
  const { booking, host, eventType } = data;

  if (booking.isCancelled) {
    return { error: "Cancelled bookings cannot be rescheduled." };
  }

  const durationMins = Math.round((booking.endTime.getTime() - booking.startTime.getTime()) / 60000);

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
        ne(bookings.id, booking.id),
        gte(bookings.blockedEnd, now),
        lte(bookings.blockedStart, rangeEnd)
      )
    );

  const validSlots = generateSlots({
    eventType: {
      durationMinutes: durationMins, // FIX: Parentheses added
      slotIntervalMinutes: eventType.slotIntervalMinutes,
      bufferBeforeMinutes: booking.bufferBeforeMinutes,
      bufferAfterMinutes: booking.bufferAfterMinutes,
      minNoticeMinutes: eventType.minNoticeMinutes,
      maxDaysAhead: eventType.maxDaysAhead,
    },
    availabilityRules: rules,
    overrides,
    existingBookings,
    hostTimezone: host.timezone,
    guestTimezone: booking.guestTimezone,
    now,
  });

  if (!isSlotInGenerated(newStart, validSlots)) {
    return { error: "That time is no longer available. Please pick another." };
  }

  const requestedDate = new Date(newStart);
  const newRange = computeBlockedRange({
    start: requestedDate,
    durationMinutes: durationMins,
    bufferBeforeMinutes: booking.bufferBeforeMinutes,
    bufferAfterMinutes: booking.bufferAfterMinutes,
  });

  const newSequence = booking.sequence + 1;

  try {
    await db.update(bookings)
      .set({
        startTime: newRange.start,
        endTime: newRange.end,
        blockedStart: newRange.blockedStart,
        blockedEnd: newRange.blockedEnd,
        sequence: newSequence,
        reminderSentAt: null,
        updatedAt: new Date(),
      })
      .where(and(eq(bookings.id, booking.id), eq(bookings.isCancelled, false)));
  } catch (error: unknown) {
    const err = error as { code?: string; cause?: { code?: string } };
    const code = err.code || err.cause?.code;
    if (code === "23P01") {
      return { error: "That time was just taken. Please pick another." };
    }
    return { error: "Something went wrong. Please try again." };
  }

  const hostClerkId = host.clerkUserId;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;

  after(async () => {
    try {
      const guestContent = buildRescheduledGuestEmail({
        eventTitle: booking.eventTitleSnapshot,
        hostDisplayName: host.displayName,
        guestName: booking.guestName,
        guestTimezone: booking.guestTimezone,
        startTime: newRange.start,
        endTime: newRange.end,
        manageUrl: `${appUrl}/booking/${token}`,
      });

      await sendTrackedEmail({
        bookingId: booking.id,
        sequence: newSequence,
        kind: "rescheduled",
        role: "guest",
        to: [{ email: booking.guestEmail, name: booking.guestName }],
        subject: guestContent.subject,
        html: guestContent.html,
        text: guestContent.text,
      });

      const client = await clerkClient();
      const user = await client.users.getUser(hostClerkId);
      const hostEmail = user.primaryEmailAddress?.emailAddress;

      if (hostEmail) {
        const hostContent = buildRescheduledHostEmail({
          eventTitle: booking.eventTitleSnapshot,
          guestName: booking.guestName,
          guestEmail: booking.guestEmail,
          hostTimezone: host.timezone,
          startTime: newRange.start,
          endTime: newRange.end,
        });

        await sendTrackedEmail({
          bookingId: booking.id,
          sequence: newSequence,
          kind: "rescheduled",
          role: "host",
          to: [{ email: hostEmail, name: host.displayName }],
          subject: hostContent.subject,
          html: hostContent.html,
          text: hostContent.text,
          replyTo: { email: booking.guestEmail, name: booking.guestName },
        });
      }
    } catch {
      // handled by sendTrackedEmail
    }
  });

  redirect(`/booking/${token}`);
}