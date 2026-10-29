import { describe, it, expect } from "vitest";
import { generateSlots, GenerateSlotsParams } from "./index";

const defaultEventType = {
  durationMinutes: 30,
  slotIntervalMinutes: 30,
  bufferBeforeMinutes: 0,
  bufferAfterMinutes: 0,
  minNoticeMinutes: 0,
  maxDaysAhead: 1, // restricted to 1 day for easier testing
};

describe("generateSlots", () => {
  const now = new Date("2026-06-01T00:00:00Z"); // Monday

  it("generates standard slots for a weekday window", () => {
    const params: GenerateSlotsParams = {
      eventType: defaultEventType,
      availabilityRules: [{ weekday: 1, startTime: "09:00", endTime: "11:00" }],
      overrides: [],
      existingBookings: [],
      hostTimezone: "America/New_York",
      guestTimezone: "Europe/London",
      now,
    };
    const slots = generateSlots(params);
    expect(slots).toHaveLength(4);
    expect(slots[0].start.toISOString()).toBe("2026-06-01T13:00:00.000Z");
    expect(slots[3].start.toISOString()).toBe("2026-06-01T14:30:00.000Z");
  });

  it("respects buffer overlaps", () => {
    const params: GenerateSlotsParams = {
      eventType: { ...defaultEventType, bufferBeforeMinutes: 15, bufferAfterMinutes: 15 },
      availabilityRules: [{ weekday: 1, startTime: "09:00", endTime: "12:00" }],
      overrides: [],
      existingBookings: [
        // Booking from 09:30 to 10:00 EDT (13:30 to 14:00 UTC)
        { 
          blockedStart: new Date("2026-06-01T13:30:00.000Z"), 
          blockedEnd: new Date("2026-06-01T14:00:00.000Z") 
        }
      ],
      hostTimezone: "America/New_York",
      guestTimezone: "Europe/London",
      now,
    };
    const slots = generateSlots(params);
    // 9:00 (13:00 UTC) is blocked because its 15-min after-buffer overlaps the 13:30 booking.
    // 9:30 (13:30 UTC) is blocked because of the booking.
    // 10:00 (14:00 UTC) is blocked because its 15-min before-buffer overlaps the 14:00 booking end.
    // 10:30 (14:30 UTC) is OK.
    // 11:00 (15:00 UTC) is OK.
    // 11:30 (15:30 UTC) is OK.
    expect(slots).toHaveLength(3);
    expect(slots.map(s => s.start.toISOString())).toEqual([
      "2026-06-01T14:30:00.000Z",
      "2026-06-01T15:00:00.000Z",
      "2026-06-01T15:30:00.000Z"
    ]);
  });

  it("skips slots in the spring-forward DST gap", () => {
    const dstNow = new Date("2026-03-08T00:00:00Z"); // Sunday
    const params: GenerateSlotsParams = {
      eventType: defaultEventType,
      availabilityRules: [{ weekday: 0, startTime: "01:00", endTime: "04:00" }],
      overrides: [],
      existingBookings: [],
      hostTimezone: "America/New_York",
      guestTimezone: "America/New_York",
      now: dstNow,
    };
    const slots = generateSlots(params);
    
    // 01:00 EST -> 06:00 UTC
    // 01:30 EST -> 06:30 UTC
    // 02:00 and 02:30 are skipped (gap)
    // 03:00 EDT -> 07:00 UTC
    // 03:30 EDT -> 07:30 UTC
    expect(slots.map(s => s.start.toISOString())).toEqual([
      "2026-03-08T06:00:00.000Z",
      "2026-03-08T06:30:00.000Z",
      "2026-03-08T07:00:00.000Z",
      "2026-03-08T07:30:00.000Z"
    ]);
  });

  it("resolves the fall-back ambiguous hour to the first occurrence", () => {
    const dstNow = new Date("2026-11-01T00:00:00Z"); // Sunday
    const params: GenerateSlotsParams = {
      eventType: defaultEventType,
      availabilityRules: [{ weekday: 0, startTime: "01:00", endTime: "03:00" }],
      overrides: [],
      existingBookings: [],
      hostTimezone: "America/New_York",
      guestTimezone: "America/New_York",
      now: dstNow,
    };
    const slots = generateSlots(params);
    
    // 01:00 EDT (first occurrence) -> 05:00 UTC
    // 01:30 EDT (first occurrence) -> 05:30 UTC
    // 02:00 EST -> 07:00 UTC
    // 02:30 EST -> 07:30 UTC
    expect(slots.map(s => s.start.toISOString())).toEqual([
      "2026-11-01T05:00:00.000Z",
      "2026-11-01T05:30:00.000Z",
      "2026-11-01T07:00:00.000Z",
      "2026-11-01T07:30:00.000Z"
    ]);
  });
});