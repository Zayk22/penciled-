// src/app/api/cron/reminders/route.ts
import { NextResponse } from "next/server";
import { db } from "@/db";
import { bookings, hosts } from "@/db/schema";
import { eq, and, gte, lte, isNull } from "drizzle-orm";
import { clerkClient } from "@clerk/nextjs/server";
import { sendTrackedEmail } from "@/lib/email/events";
import { buildReminderGuestEmail, buildReminderHostEmail } from "@/lib/email/templates";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const now = new Date();
  const in24Hours = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  const in48Hours = new Date(now.getTime() + 48 * 60 * 60 * 1000);

  // Find bookings starting in the next 24-48 hours that haven't been reminded.
  const upcomingBookings = await db
    .select({ booking: bookings, host: hosts })
    .from(bookings)
    .innerJoin(hosts, eq(bookings.hostId, hosts.id))
    .where(
      and(
        eq(bookings.isCancelled, false),
        isNull(bookings.reminderSentAt),
        gte(bookings.startTime, in24Hours),
        lte(bookings.startTime, in48Hours)
      )
    );

  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  let sentCount = 0;

  for (const { booking, host } of upcomingBookings) {
    try {
      const guestContent = buildReminderGuestEmail({
        eventTitle: booking.eventTitleSnapshot,
        hostDisplayName: host.displayName,
        guestName: booking.guestName,
        guestTimezone: booking.guestTimezone,
        startTime: booking.startTime,
        endTime: booking.endTime,
        manageUrl: `${appUrl}/booking/`, // Token not available here
      });

      // Send Guest
      await sendTrackedEmail({
        bookingId: booking.id,
        sequence: booking.sequence,
        kind: "reminder",
        role: "guest",
        to: [{ email: booking.guestEmail, name: booking.guestName }],
        subject: guestContent.subject,
        html: guestContent.html,
        text: guestContent.text,
      });

      // Send Host
      const client = await clerkClient();
      const user = await client.users.getUser(host.clerkUserId);
      const hostEmail = user.primaryEmailAddress?.emailAddress;

      if (hostEmail) {
        const hostContent = buildReminderHostEmail({
          eventTitle: booking.eventTitleSnapshot,
          guestName: booking.guestName,
          guestEmail: booking.guestEmail,
          hostTimezone: host.timezone,
          startTime: booking.startTime,
          endTime: booking.endTime,
        });

        await sendTrackedEmail({
          bookingId: booking.id,
          sequence: booking.sequence,
          kind: "reminder",
          role: "host",
          to: [{ email: hostEmail, name: host.displayName }],
          subject: hostContent.subject,
          html: hostContent.html,
          text: hostContent.text,
          replyTo: { email: booking.guestEmail, name: booking.guestName },
        });
      }

      // Mark reminder sent
      await db.update(bookings)
        .set({ reminderSentAt: new Date() })
        .where(eq(bookings.id, booking.id));

      sentCount++;
    } catch (error) {
      console.error(`Failed to process reminders for booking ${booking.id}:`, error);
      // Continue to next booking even if one fails
    }
  }

  return NextResponse.json({ ok: true, processed: upcomingBookings.length, sent: sentCount });
}