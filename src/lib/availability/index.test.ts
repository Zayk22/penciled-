// src/lib/availability/index.test.ts
import { describe, it, expect } from "vitest";
import { generateSlots, GenerateSlotsParams } from "./index";
import { wallClockToUtc, getTimezoneOffsetMinutes } from "../time";

const defaultEventType = {
  durationMinutes: 30,
  slotIntervalMinutes: 30,
  bufferBeforeMinutes: 0,
  bufferAfterMinutes: 0,
  minNoticeMinutes: 0,
  maxDaysAhead: 1,
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
        { blockedStart: new Date("2026-06-01T13:30:00.000Z"), blockedEnd: new Date("2026-06-01T14:00:00.000Z") }
      ],
      hostTimezone: "America/New_York",
      guestTimezone: "Europe/London",
      now,
    };
    const slots = generateSlots(params);
    expect(slots).toHaveLength(3);
    expect(slots.map(s => s.start.toISOString())).toEqual([
      "2026-06-01T14:30:00.000Z",
      "2026-06-01T15:00:00.000Z",
      "2026-06-01T15:30:00.000Z"
    ]);
  });

  it("respects minimum notice", () => {
    const params: GenerateSlotsParams = {
      eventType: { ...defaultEventType, minNoticeMinutes: 60 },
      availabilityRules: [{ weekday: 1, startTime: "09:00", endTime: "11:00" }],
      overrides: [],
      existingBookings: [],
      hostTimezone: "America/New_York",
      guestTimezone: "Europe/London",
      now: new Date("2026-06-01T12:30:00Z"), // 08:30 EDT
    };
    const slots = generateSlots(params);
    expect(slots).toHaveLength(3);
    expect(slots[0].start.toISOString()).toBe("2026-06-01T13:30:00.000Z");
  });

  it("allows back-to-back bookings (half-open intervals)", () => {
    const params: GenerateSlotsParams = {
      eventType: defaultEventType,
      availabilityRules: [{ weekday: 1, startTime: "09:00", endTime: "11:00" }],
      overrides: [],
      existingBookings: [
        { blockedStart: new Date("2026-06-01T13:00:00.000Z"), blockedEnd: new Date("2026-06-01T13:30:00.000Z") }
      ],
      hostTimezone: "America/New_York",
      guestTimezone: "Europe/London",
      now,
    };
    const slots = generateSlots(params);
    expect(slots).toHaveLength(3);
    expect(slots[0].start.toISOString()).toBe("2026-06-01T13:30:00.000Z");
  });

  it("blocked day produces no slots", () => {
    const params: GenerateSlotsParams = {
      eventType: defaultEventType,
      availabilityRules: [{ weekday: 1, startTime: "09:00", endTime: "17:00" }],
      overrides: [{ date: "2026-06-01", isBlocked: true }],
      existingBookings: [],
      hostTimezone: "America/New_York",
      guestTimezone: "UTC",
      now,
    };
    const slots = generateSlots(params);
    expect(slots).toHaveLength(0);
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
    expect(slots.map(s => s.start.toISOString())).toEqual([
      "2026-03-08T06:00:00.000Z", // 01:00 EST
      "2026-03-08T06:30:00.000Z", // 01:30 EST
      "2026-03-08T07:00:00.000Z", // 03:00 EDT
      "2026-03-08T07:30:00.000Z"  // 03:30 EDT
    ]);
  });

  it("generates absolute slots across the fall-back ambiguous hour", () => {
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
    expect(slots.map(s => s.start.toISOString())).toEqual([
      "2026-11-01T05:00:00.000Z", // 01:00 EDT
      "2026-11-01T05:30:00.000Z", // 01:30 EDT
      "2026-11-01T06:00:00.000Z", // 01:00 EST (repeated)
      "2026-11-01T06:30:00.000Z", // 01:30 EST
      "2026-11-01T07:00:00.000Z", // 02:00 EST
      "2026-11-01T07:30:00.000Z"  // 02:30 EST
    ]);
  });

  it("handles midnight windows correctly (hourCycle h23)", () => {
    const params: GenerateSlotsParams = {
      eventType: defaultEventType,
      availabilityRules: [{ weekday: 1, startTime: "00:00", endTime: "02:00" }],
      overrides: [],
      existingBookings: [],
      hostTimezone: "America/New_York",
      guestTimezone: "UTC",
      now,
    };
    const slots = generateSlots(params);
    expect(slots).toHaveLength(4);
    expect(slots[0].start.toISOString()).toBe("2026-06-01T04:00:00.000Z");
  });

  it("matches host calendar day even when server is in different TZ", () => {
    const params: GenerateSlotsParams = {
      eventType: defaultEventType,
      availabilityRules: [{ weekday: 1, startTime: "21:00", endTime: "22:00" }],
      overrides: [],
      existingBookings: [],
      hostTimezone: "America/Los_Angeles",
      guestTimezone: "UTC",
      now: new Date("2026-06-02T03:00:00Z"), // Monday June 1, 20:00 LA
    };
    const slots = generateSlots(params);
    expect(slots).toHaveLength(2);
    expect(slots[0].start.toISOString()).toBe("2026-06-02T04:00:00.000Z");
    expect(slots[1].start.toISOString()).toBe("2026-06-02T04:30:00.000Z");
  });

  it("applies override on host calendar day when server is in different TZ", () => {
    const params: GenerateSlotsParams = {
      eventType: defaultEventType,
      availabilityRules: [{ weekday: 1, startTime: "21:00", endTime: "22:00" }],
      overrides: [{ date: "2026-06-01", isBlocked: true }],
      existingBookings: [],
      hostTimezone: "America/Los_Angeles",
      guestTimezone: "UTC",
      now: new Date("2026-06-02T03:00:00Z"),
    };
    const slots = generateSlots(params);
    expect(slots).toHaveLength(0);
  });

  it("applies override on spring-forward DST day", () => {
    const dstNow = new Date("2026-03-08T00:00:00Z");
    const params: GenerateSlotsParams = {
      eventType: defaultEventType,
      availabilityRules: [{ weekday: 0, startTime: "09:00", endTime: "17:00" }],
      overrides: [{ date: "2026-03-08", isBlocked: false, startTime: "10:00", endTime: "11:00" }],
      existingBookings: [],
      hostTimezone: "America/New_York",
      guestTimezone: "UTC",
      now: dstNow,
    };
    const slots = generateSlots(params);
    expect(slots).toHaveLength(2);
    expect(slots[0].start.toISOString()).toBe("2026-03-08T14:00:00.000Z");
  });

  it("applies override on fall-back DST day", () => {
    const dstNow = new Date("2026-11-01T00:00:00Z");
    const params: GenerateSlotsParams = {
      eventType: defaultEventType,
      availabilityRules: [{ weekday: 0, startTime: "09:00", endTime: "17:00" }],
      overrides: [{ date: "2026-11-01", isBlocked: false, startTime: "01:00", endTime: "02:00" }],
      existingBookings: [],
      hostTimezone: "America/New_York",
      guestTimezone: "UTC",
      now: dstNow,
    };
    const slots = generateSlots(params);
    expect(slots).toHaveLength(4);
    expect(slots.map(s => s.start.toISOString())).toEqual([
      "2026-11-01T05:00:00.000Z",
      "2026-11-01T05:30:00.000Z",
      "2026-11-01T06:00:00.000Z",
      "2026-11-01T06:30:00.000Z"
    ]);
  });

  it("normalizes HH:MM:SS inputs", () => {
    const params: GenerateSlotsParams = {
      eventType: defaultEventType,
      availabilityRules: [{ weekday: 1, startTime: "09:00:00", endTime: "10:00:00" }],
      overrides: [],
      existingBookings: [],
      hostTimezone: "America/New_York",
      guestTimezone: "UTC",
      now,
    };
    const slots = generateSlots(params);
    expect(slots).toHaveLength(2);
    expect(slots[0].start.toISOString()).toBe("2026-06-01T13:00:00.000Z");
  });
});

describe("wallClockToUtc DST Gaps", () => {
  it("ensures getTimezoneOffsetMinutes returns an integer for non-zero ms", () => {
    expect(getTimezoneOffsetMinutes(new Date("2026-03-08T06:56:15.878Z"), "America/New_York")).toBe(-300);
  });

  it("ensures wallClockToUtc results have 0 milliseconds", () => {
    const result = wallClockToUtc(2026, 3, 8, 2, 0, "America/New_York");
    expect(result.getMilliseconds()).toBe(0);
  });

  it("resolves a start time inside the gap to the transition point", () => {
    expect(wallClockToUtc(2026, 3, 8, 2, 0, "America/New_York").toISOString()).toBe("2026-03-08T07:00:00.000Z");
    expect(wallClockToUtc(2026, 3, 8, 2, 30, "America/New_York").toISOString()).toBe("2026-03-08T07:00:00.000Z");
  });

  it("leaves valid times around the gap unchanged", () => {
    expect(wallClockToUtc(2026, 3, 8, 1, 30, "America/New_York").toISOString()).toBe("2026-03-08T06:30:00.000Z");
    expect(wallClockToUtc(2026, 3, 8, 3, 0, "America/New_York").toISOString()).toBe("2026-03-08T07:00:00.000Z");
  });

  it("handles a gap starting at midnight (America/Havana) derived from Intl", () => {
    const fmt = new Intl.DateTimeFormat("en-US", { timeZone: "America/Havana", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit", hourCycle: "h23" });
    // Verify the transition instant
    expect(fmt.format(new Date("2026-03-08T04:59:59Z"))).toBe("03/07/2026, 23:59:59");
    expect(fmt.format(new Date("2026-03-08T05:00:00Z"))).toBe("03/08/2026, 01:00:00");
    
    expect(wallClockToUtc(2026, 3, 8, 0, 30, "America/Havana").toISOString()).toBe("2026-03-08T05:00:00.000Z");
  });

  it("generateSlots handles a window starting in the gap", () => {
    const dstNow = new Date("2026-03-08T00:00:00Z");
    const params: GenerateSlotsParams = {
      eventType: defaultEventType,
      availabilityRules: [{ weekday: 0, startTime: "02:00", endTime: "05:00" }],
      overrides: [],
      existingBookings: [],
      hostTimezone: "America/New_York",
      guestTimezone: "UTC",
      now: dstNow,
    };
    const slots = generateSlots(params);
    expect(slots.map(s => s.start.toISOString())).toEqual([
      "2026-03-08T07:00:00.000Z",
      "2026-03-08T07:30:00.000Z",
      "2026-03-08T08:00:00.000Z",
      "2026-03-08T08:30:00.000Z"
    ]);
  });

  it("generateSlots handles a window ending in the gap", () => {
    const dstNow = new Date("2026-03-08T00:00:00Z");
    const params: GenerateSlotsParams = {
      eventType: defaultEventType,
      availabilityRules: [{ weekday: 0, startTime: "01:00", endTime: "02:30" }],
      overrides: [],
      existingBookings: [],
      hostTimezone: "America/New_York",
      guestTimezone: "UTC",
      now: dstNow,
    };
    const slots = generateSlots(params);
    expect(slots.map(s => s.start.toISOString())).toEqual([
      "2026-03-08T06:00:00.000Z",
      "2026-03-08T06:30:00.000Z"
    ]);
  });

  it("generateSlots returns 0 slots for a window entirely inside the gap", () => {
    const dstNow = new Date("2026-03-08T00:00:00Z");
    const params: GenerateSlotsParams = {
      eventType: defaultEventType,
      availabilityRules: [{ weekday: 0, startTime: "02:00", endTime: "02:30" }],
      overrides: [],
      existingBookings: [],
      hostTimezone: "America/New_York",
      guestTimezone: "UTC",
      now: dstNow,
    };
    const slots = generateSlots(params);
    expect(slots).toHaveLength(0);
  });
});