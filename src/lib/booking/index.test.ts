// src/lib/booking/index.test.ts
import { describe, it, expect } from "vitest";
import { computeBlockedRange, isSlotInGenerated } from "./index";

describe("computeBlockedRange", () => {
  it("computes a range with no buffers", () => {
    const start = new Date("2026-06-01T10:00:00.000Z");
    const result = computeBlockedRange({
      start,
      durationMinutes: 30,
      bufferBeforeMinutes: 0,
      bufferAfterMinutes: 0,
    });
    expect(result.start.toISOString()).toBe("2026-06-01T10:00:00.000Z");
    expect(result.end.toISOString()).toBe("2026-06-01T10:30:00.000Z");
    expect(result.blockedStart.toISOString()).toBe("2026-06-01T10:00:00.000Z");
    expect(result.blockedEnd.toISOString()).toBe("2026-06-01T10:30:00.000Z");
  });

  it("extends the blocked range by the before and after buffers", () => {
    const start = new Date("2026-06-01T10:00:00.000Z");
    const result = computeBlockedRange({
      start,
      durationMinutes: 30,
      bufferBeforeMinutes: 15,
      bufferAfterMinutes: 10,
    });
    expect(result.start.toISOString()).toBe("2026-06-01T10:00:00.000Z");
    expect(result.end.toISOString()).toBe("2026-06-01T10:30:00.000Z");
    expect(result.blockedStart.toISOString()).toBe("2026-06-01T09:45:00.000Z");
    expect(result.blockedEnd.toISOString()).toBe("2026-06-01T10:40:00.000Z");
  });

  it("handles a slot spanning the 2026-11-01 DST fall-back hour", () => {
    // 05:30Z is 01:30 EDT (first occurrence). 60 minutes later, 06:30Z is 01:30 EST.
    const start = new Date("2026-11-01T05:30:00.000Z");
    const result = computeBlockedRange({
      start,
      durationMinutes: 60,
      bufferBeforeMinutes: 0,
      bufferAfterMinutes: 0,
    });
    expect(result.start.toISOString()).toBe("2026-11-01T05:30:00.000Z");
    expect(result.end.toISOString()).toBe("2026-11-01T06:30:00.000Z");
    expect(result.blockedStart.toISOString()).toBe("2026-11-01T05:30:00.000Z");
    expect(result.blockedEnd.toISOString()).toBe("2026-11-01T06:30:00.000Z");
  });

  it("satisfies the DB CHECK invariants", () => {
    const start = new Date("2026-06-01T10:00:00.000Z");
    const result = computeBlockedRange({
      start,
      durationMinutes: 45,
      bufferBeforeMinutes: 5,
      bufferAfterMinutes: 5,
    });
    expect(result.blockedStart.getTime()).toBeLessThanOrEqual(result.start.getTime());
    expect(result.end.getTime()).toBeLessThanOrEqual(result.blockedEnd.getTime());
    expect(result.start.getTime()).toBeLessThan(result.end.getTime());
  });

  it("throws RangeError for an invalid start Date", () => {
    expect(() =>
      computeBlockedRange({
        start: new Date("not a date"),
        durationMinutes: 30,
        bufferBeforeMinutes: 0,
        bufferAfterMinutes: 0,
      })
    ).toThrow(RangeError);
  });

  it("throws RangeError for a zero duration", () => {
    expect(() =>
      computeBlockedRange({
        start: new Date("2026-06-01T10:00:00.000Z"),
        durationMinutes: 0,
        bufferBeforeMinutes: 0,
        bufferAfterMinutes: 0,
      })
    ).toThrow(RangeError);
  });

  it("throws RangeError for a negative duration", () => {
    expect(() =>
      computeBlockedRange({
        start: new Date("2026-06-01T10:00:00.000Z"),
        durationMinutes: -30,
        bufferBeforeMinutes: 0,
        bufferAfterMinutes: 0,
      })
    ).toThrow(RangeError);
  });

  it("throws RangeError for a negative bufferBefore", () => {
    expect(() =>
      computeBlockedRange({
        start: new Date("2026-06-01T10:00:00.000Z"),
        durationMinutes: 30,
        bufferBeforeMinutes: -5,
        bufferAfterMinutes: 0,
      })
    ).toThrow(RangeError);
  });

  it("throws RangeError for a negative bufferAfter", () => {
    expect(() =>
      computeBlockedRange({
        start: new Date("2026-06-01T10:00:00.000Z"),
        durationMinutes: 30,
        bufferBeforeMinutes: 0,
        bufferAfterMinutes: -5,
      })
    ).toThrow(RangeError);
  });
});

describe("isSlotInGenerated", () => {
  const slots = [
    { start: new Date("2026-06-01T10:00:00.000Z") },
    { start: new Date("2026-06-01T10:30:00.000Z") },
    { start: new Date("2026-06-01T11:00:00.000Z") },
  ];

  it("returns true for an exact match", () => {
    expect(isSlotInGenerated("2026-06-01T10:30:00.000Z", slots)).toBe(true);
    expect(isSlotInGenerated("2026-06-01T11:00:00.000Z", slots)).toBe(true);
  });

  it("returns false for an off-by-one-minute string", () => {
    expect(isSlotInGenerated("2026-06-01T10:31:00.000Z", slots)).toBe(false);
    expect(isSlotInGenerated("2026-06-01T10:29:00.000Z", slots)).toBe(false);
  });

  it("returns false for an invalid date string", () => {
    expect(isSlotInGenerated("not a date", slots)).toBe(false);
    expect(isSlotInGenerated("", slots)).toBe(false);
  });

  it("normalizes milliseconds: with and without .000 both match", () => {
    // Requested without milliseconds
    expect(isSlotInGenerated("2026-06-01T10:00:00Z", slots)).toBe(true);
    // Requested with explicit .000
    expect(isSlotInGenerated("2026-06-01T10:00:00.000Z", slots)).toBe(true);
  });

  it("returns false for an empty slot list", () => {
    expect(isSlotInGenerated("2026-06-01T10:00:00.000Z", [])).toBe(false);
  });
});