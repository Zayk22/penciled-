// src/lib/email/events.integration.test.ts
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { config } from "dotenv";
import { eq } from "drizzle-orm";

config({ path: ".env.local" });

import { db } from "../../db";
import { hosts, eventTypes, bookings } from "../../db/schema";
import { tryClaimNew, tryReclaimStale, tryRetryFailed } from "./events";

if (process.env.ALLOW_INTEGRATION_TESTS !== "true") {
  throw new Error("Set ALLOW_INTEGRATION_TESTS=true in .env.local to run.");
}

describe("Email Events Concurrency (Integration)", () => {
  let testBookingId: string;

  beforeAll(async () => {
    const [host] = await db.insert(hosts).values({
      clerkUserId: `test_email_${Date.now()}`,
      username: `testuser_email_${Date.now()}`,
      displayName: "Email Test Host",
      timezone: "America/New_York",
    }).returning();

    const [eventType] = await db.insert(eventTypes).values({
      hostId: host.id,
      title: "Email Test Meeting",
      slug: `email-test-${Date.now()}`,
      durationMinutes: 30,
      slotIntervalMinutes: 30,
      bufferBeforeMinutes: 0,
      bufferAfterMinutes: 0,
      minNoticeMinutes: 0,
      maxDaysAhead: 30,
    }).returning();

    // Distinct start and end times. The schema requires startTime < endTime.
    const start = new Date("2026-06-01T14:00:00Z");
    const end = new Date("2026-06-01T14:30:00Z");

    const [booking] = await db.insert(bookings).values({
      eventTypeId: eventType.id,
      hostId: host.id,
      guestName: "Guest",
      guestEmail: "guest@example.com",
      guestTimezone: "UTC",
      eventTitleSnapshot: "Email Test",
      bufferBeforeMinutes: 0,
      bufferAfterMinutes: 0,
      startTime: start,
      endTime: end,
      blockedStart: start,
      blockedEnd: end,
    }).returning();

    testBookingId = booking.id;
  });

  afterAll(async () => {
    if (testBookingId) {
      await db.delete(bookings).where(eq(bookings.id, testBookingId));
    }
  });

  it("allows exactly one concurrent claim", async () => {
    const p1 = tryClaimNew(testBookingId, "confirmed", "guest", 0);
    const p2 = tryClaimNew(testBookingId, "confirmed", "guest", 0);

    const [r1, r2] = await Promise.all([p1, p2]);
    const claimed = [r1, r2].filter(r => r !== null);

    expect(claimed).toHaveLength(1);
  });

  it("does not reclaim a fresh pending row", async () => {
    const reclaimed = await tryReclaimStale(testBookingId, "confirmed", "guest", 0);
    expect(reclaimed).toBeNull();
  });

  it("can retry a failed row and prevents simultaneous retries", async () => {
    await db.execute(
      `UPDATE email_events SET status = 'failed' WHERE booking_id = '${testBookingId}' AND recipient_role = 'guest'`
    );

    const p1 = tryRetryFailed(testBookingId, "confirmed", "guest", 0);
    const p2 = tryRetryFailed(testBookingId, "confirmed", "guest", 0);

    const [r1, r2] = await Promise.all([p1, p2]);
    const retried = [r1, r2].filter(r => r !== null);

    expect(retried).toHaveLength(1);
  });
});