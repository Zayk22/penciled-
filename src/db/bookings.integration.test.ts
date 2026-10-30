// src/db/bookings.integration.test.ts
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { config } from "dotenv";
import { eq } from "drizzle-orm";

config({ path: ".env.local" });

import { db } from "./index";
import { hosts, eventTypes, bookings } from "./schema";

// Safety switch
if (process.env.ALLOW_INTEGRATION_TESTS !== "true") {
  throw new Error("Integration tests are disabled. Set ALLOW_INTEGRATION_TESTS=true in .env.local to run them.");
}

describe("Database Concurrency (Integration)", () => {
  let testHostId: string;
  let testEventTypeId: string;

  beforeAll(async () => {
    const [host] = await db.insert(hosts).values({
      clerkUserId: `test_clerk_${Date.now()}`,
      username: `testuser_${Date.now()}`,
      displayName: "Test Host",
      timezone: "America/New_York",
    }).returning();

    testHostId = host.id;

    const [eventType] = await db.insert(eventTypes).values({
      hostId: testHostId,
      title: "Test Meeting",
      slug: `test-meeting-${Date.now()}`,
      durationMinutes: 30,
      slotIntervalMinutes: 30,
      bufferBeforeMinutes: 0,
      bufferAfterMinutes: 0,
      minNoticeMinutes: 0,
      maxDaysAhead: 30,
    }).returning();

    testEventTypeId = eventType.id;
  });

  afterAll(async () => {
    if (testHostId) {
      await db.delete(hosts).where(eq(hosts.id, testHostId));
    }
  });

  it("prevents overlapping bookings at the database level", async () => {
    const startTime = new Date("2026-07-01T14:00:00Z");
    const endTime = new Date("2026-07-01T14:30:00Z");
    const blockedStart = new Date(startTime.getTime());
    const blockedEnd = new Date(endTime.getTime());

    const baseBooking = {
      eventTypeId: testEventTypeId,
      hostId: testHostId,
      guestName: "Test Guest",
      guestEmail: "guest@example.com",
      guestTimezone: "America/New_York",
      eventTitleSnapshot: "Test Meeting",
      bufferBeforeMinutes: 0,
      bufferAfterMinutes: 0,
    };

    const insert1 = db.insert(bookings).values({
      ...baseBooking,
      startTime,
      endTime,
      blockedStart,
      blockedEnd,
    });

    const insert2 = db.insert(bookings).values({
      ...baseBooking,
      startTime,
      endTime,
      blockedStart,
      blockedEnd,
    });

    const results = await Promise.allSettled([insert1, insert2]);

    const fulfilled = results.filter((r) => r.status === "fulfilled");
    const rejected = results.filter((r) => r.status === "rejected");

    expect(fulfilled).toHaveLength(1);
    expect(rejected).toHaveLength(1);

    const error = (rejected[0] as PromiseRejectedResult).reason;
    const errorCode = error.code || error.cause?.code;
    expect(errorCode).toBe("23P01");
  });
});