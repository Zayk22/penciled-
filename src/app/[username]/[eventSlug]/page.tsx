// src/app/[username]/[eventSlug]/page.tsx
import { notFound } from "next/navigation";
import { db } from "@/db";
import { hosts, eventTypes, availabilityRules, dateOverrides, bookings } from "@/db/schema";
import { eq, and, gte, lte } from "drizzle-orm";
import { generateSlots } from "@/lib/availability";
import { getTodayInTimezone } from "@/lib/time";
import { BookingClient } from "./BookingClient";

export const dynamic = "force-dynamic";

export default async function BookingPage({
  params,
}: {
  params: Promise<{ username: string; eventSlug: string }>;
}) {
  const { username, eventSlug } = await params;
  const normalizedUsername = username.toLowerCase();

  const hostResult = await db.select().from(hosts).where(eq(hosts.username, normalizedUsername)).limit(1);
  const host = hostResult[0];
  if (!host) notFound();

  const eventTypeResult = await db
    .select()
    .from(eventTypes)
    .where(and(eq(eventTypes.hostId, host.id), eq(eventTypes.slug, eventSlug), eq(eventTypes.isActive, true)))
    .limit(1);
  const eventType = eventTypeResult[0];
  if (!eventType) notFound();

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

  const rawSlots = generateSlots({
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
    guestTimezone: "UTC",
    now,
  });

  const clientSlots = rawSlots.map(s => ({ start: s.start.toISOString(), end: s.end.toISOString() }));

  const clientData = {
    eventType: {
      title: eventType.title,
      description: eventType.description,
      durationMinutes: eventType.durationMinutes,
    },
    host: {
      displayName: host.displayName,
      timezone: host.timezone,
      username: host.username,
    },
    slots: clientSlots,
    eventSlug: eventType.slug, // FIX: explicitly pass the slug
  };

  return <BookingClient data={clientData} />;
}