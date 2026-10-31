// src/app/booking/[token]/reschedule/page.tsx
import { notFound } from "next/navigation";
import { db } from "@/db";
import { bookings, hosts, eventTypes, availabilityRules, dateOverrides } from "@/db/schema";
import { eq, and, gte, lte, ne } from "drizzle-orm";
import { isValidTokenFormat, hashToken } from "@/lib/tokens";
import { generateSlots } from "@/lib/availability";
import { getTodayInTimezone } from "@/lib/time";
import { Logo } from "@/components/Logo";
import { RescheduleForm } from "@/components/ui/RescheduleForm";
import Link from "next/link";
import { Button } from "@/components/ui/Button";

export const dynamic = "force-dynamic";

export default async function ReschedulePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  if (!isValidTokenFormat(token)) notFound();

  const hash = hashToken(token);
  const bookingResult = await db
    .select({ booking: bookings, host: hosts, eventType: eventTypes })
    .from(bookings)
    .innerJoin(hosts, eq(bookings.hostId, hosts.id))
    .innerJoin(eventTypes, eq(bookings.eventTypeId, eventTypes.id))
    .where(eq(bookings.manageTokenHash, hash))
    .limit(1);

  const data = bookingResult[0];
  if (!data) notFound();
  const { booking, host, eventType } = data;

  if (booking.isCancelled) {
    return (
      <div className="min-h-screen bg-paper flex flex-col items-center justify-center p-6">
        <Logo variant="full" className="mb-8" />
        <div className="text-center max-w-md">
          <h1 className="font-serif text-2xl mb-2">This booking was cancelled</h1>
          <Link href={`/booking/${token}`}>
            <Button variant="secondary">Back to booking</Button>
          </Link>
        </div>
      </div>
    );
  }

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
    guestTimezone: booking.guestTimezone,
    now,
  });

  const slotsWithLabels = validSlots.map(slot => {
    const dateStr = new Intl.DateTimeFormat("en-US", {
      timeZone: booking.guestTimezone,
      weekday: "short",
      month: "short",
      day: "numeric",
    }).format(slot.start);
    
    const timeStr = new Intl.DateTimeFormat("en-US", {
      timeZone: booking.guestTimezone,
      hour: "numeric",
      minute: "2-digit",
    }).format(slot.start);

    return {
      start: slot.start.toISOString(),
      label: `${dateStr} at ${timeStr}`,
    };
  });

  return (
    <div className="min-h-screen bg-paper flex flex-col items-center justify-center p-6">
      <Logo variant="full" className="mb-8" />
      <div className="bg-surface border border-border rounded-md p-6 md:p-8 max-w-md w-full">
        <h1 className="font-serif text-2xl mb-2">Reschedule booking</h1>
        <p className="text-muted mb-6">
          Choose a new time for <strong>{booking.eventTitleSnapshot}</strong> with {host.displayName}.
        </p>

        {slotsWithLabels.length === 0 ? (
          <div className="text-center py-6">
            <p className="text-muted mb-4">No new times are available right now.</p>
            <Link href={`/booking/${token}`}>
              <Button variant="secondary">Back to booking</Button>
            </Link>
          </div>
        ) : (
          <RescheduleForm token={token} slots={slotsWithLabels} />
        )}
      </div>
    </div>
  );
}