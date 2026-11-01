// src/app/dashboard/bookings/actions.ts
"use server";

import { auth } from "@clerk/nextjs/server";
import { db } from "@/db";
import { bookings, hosts } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { after } from "next/server";
import { clerkClient } from "@clerk/nextjs/server";
import { buildCancelledGuestEmail, buildCancelledHostEmail } from "@/lib/email/templates";
import { sendTrackedEmail } from "@/lib/email/events";

export async function cancelHostBooking(bookingId: string) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const hostResult = await db.select().from(hosts).where(eq(hosts.clerkUserId, userId)).limit(1);
  const host = hostResult[0];
  if (!host) throw new Error("Host not found");

  const bookingResult = await db.select().from(bookings).where(
    and(eq(bookings.id, bookingId), eq(bookings.hostId, host.id))
  ).limit(1);
  
  const booking = bookingResult[0];
  if (!booking) throw new Error("Booking not found");
  if (booking.isCancelled) return;

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

  revalidatePath("/dashboard/bookings");
  revalidatePath("/dashboard");
}