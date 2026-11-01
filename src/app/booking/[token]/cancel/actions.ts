// src/app/booking/[token]/cancel/actions.ts
"use server";

import { db } from "@/db";
import { bookings, hosts } from "@/db/schema";
import { eq } from "drizzle-orm";
import { isValidTokenFormat, hashToken } from "@/lib/tokens";
import { redirect, notFound } from "next/navigation";
import { after } from "next/server";
import { clerkClient } from "@clerk/nextjs/server";
import { buildCancelledGuestEmail, buildCancelledHostEmail } from "@/lib/email/templates";
import { sendTrackedEmail } from "@/lib/email/events";

export async function cancelBooking(formData: FormData): Promise<void> {
  const token = formData.get("token") as string;
  if (!isValidTokenFormat(token)) {
    notFound();
  }

  const hash = hashToken(token);
  const result = await db
    .select({ booking: bookings, host: hosts })
    .from(bookings)
    .innerJoin(hosts, eq(bookings.hostId, hosts.id))
    .where(eq(bookings.manageTokenHash, hash))
    .limit(1);

  const data = result[0];
  if (!data) {
    notFound();
  }
  const { booking, host } = data;

  if (booking.isCancelled) {
    redirect(`/booking/${token}`);
  }

  const newSequence = booking.sequence + 1;

  await db.update(bookings)
    .set({
      isCancelled: true,
      cancelledAt: new Date(),
      sequence: newSequence,
      updatedAt: new Date(),
    })
    .where(eq(bookings.id, booking.id));

  const hostClerkId = host.clerkUserId;

  after(async () => {
    try {
      const guestContent = buildCancelledGuestEmail({
        eventTitle: booking.eventTitleSnapshot,
        hostDisplayName: host.displayName,
        guestName: booking.guestName,
        guestTimezone: booking.guestTimezone,
        startTime: booking.startTime,
        endTime: booking.endTime,
      });

      await sendTrackedEmail({
        bookingId: booking.id,
        sequence: newSequence,
        kind: "cancelled",
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
        const hostContent = buildCancelledHostEmail({
          eventTitle: booking.eventTitleSnapshot,
          guestName: booking.guestName,
          guestEmail: booking.guestEmail,
          hostTimezone: host.timezone,
          startTime: booking.startTime,
          endTime: booking.endTime,
        });

        await sendTrackedEmail({
          bookingId: booking.id,
          sequence: newSequence,
          kind: "cancelled",
          role: "host",
          to: [{ email: hostEmail, name: host.displayName }],
          subject: hostContent.subject,
          html: hostContent.html,
          text: hostContent.text,
          replyTo: { email: booking.guestEmail, name: booking.guestName },
        });
      }
    } catch {
      // handled
    }
  });

  redirect(`/booking/${token}`);
}