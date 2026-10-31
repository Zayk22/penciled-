// src/lib/slots/group.test.ts
import { describe, it, expect } from "vitest";
import { groupSlotsByDay, groupByPeriod } from "./group";

const fmtTime = (iso: string, tz: string) => new Intl.DateTimeFormat("en-US", { timeZone: tz, hour: "numeric", minute: "2-digit" }).format(new Date(iso));

describe("groupSlotsByDay", () => {
  it("groups by guest day spanning two host days", () => {
    const slots = [
      { start: "2026-06-01T16:00:00.000Z", end: "" },
      { start: "2026-06-02T06:00:00.000Z", end: "" },
    ];
    const result = groupSlotsByDay(slots, "Pacific/Auckland");
    
    expect(result).toHaveLength(1);
    expect(result[0].date).toBe("2026-06-02");
    expect(result[0].slots).toHaveLength(2);
    expect(result[0].slots[0].label).toBe(fmtTime("2026-06-01T16:00:00.000Z", "Pacific/Auckland"));
    expect(result[0].slots[1].label).toBe(fmtTime("2026-06-02T06:00:00.000Z", "Pacific/Auckland"));
  });

  it("groups correctly on a DST change day", () => {
    const slots = [
      { start: "2026-11-01T05:00:00.000Z", end: "" },
      { start: "2026-11-01T06:00:00.000Z", end: "" },
    ];
    const result = groupSlotsByDay(slots, "America/New_York");
    expect(result).toHaveLength(1);
    expect(result[0].date).toBe("2026-11-01");
    expect(result[0].slots[0].label).toBe(fmtTime("2026-11-01T05:00:00.000Z", "America/New_York"));
    expect(result[0].slots[1].label).toBe(fmtTime("2026-11-01T06:00:00.000Z", "America/New_York"));
  });

  it("includes month and handles month crossing", () => {
    const slots = [
      { start: "2026-11-30T15:00:00.000Z", end: "" },
      { start: "2026-12-01T15:00:00.000Z", end: "" },
    ];
    const result = groupSlotsByDay(slots, "UTC");
    expect(result).toHaveLength(2);
    expect(result[0].month).toBe("Nov");
    expect(result[1].month).toBe("Dec");
  });

  it("returns empty array for no slots", () => {
    expect(groupSlotsByDay([], "America/New_York")).toHaveLength(0);
  });
});

describe("groupByPeriod", () => {
  it("groups 11:45 as morning and 12:00 as afternoon", () => {
    const slots = [
      { start: "2026-06-01T15:45:00.000Z", label: fmtTime("2026-06-01T15:45:00.000Z", "America/New_York") },
      { start: "2026-06-01T16:00:00.000Z", label: fmtTime("2026-06-01T16:00:00.000Z", "America/New_York") },
    ];
    const result = groupByPeriod(slots, "America/New_York");
    expect(result).toHaveLength(2);
    expect(result[0].period).toBe("morning");
    expect(result[0].slots).toHaveLength(1);
    expect(result[1].period).toBe("afternoon");
    expect(result[1].slots).toHaveLength(1);
  });

  it("groups 16:45 as afternoon and 17:00 as evening", () => {
    const slots = [
      { start: "2026-06-01T20:45:00.000Z", label: fmtTime("2026-06-01T20:45:00.000Z", "America/New_York") },
      { start: "2026-06-01T21:00:00.000Z", label: fmtTime("2026-06-01T21:00:00.000Z", "America/New_York") },
    ];
    const result = groupByPeriod(slots, "America/New_York");
    expect(result).toHaveLength(2);
    expect(result[0].period).toBe("afternoon");
    expect(result[1].period).toBe("evening");
  });

  it("groups midnight as morning", () => {
    const slots = [
      { start: "2026-06-01T04:00:00.000Z", label: fmtTime("2026-06-01T04:00:00.000Z", "America/New_York") },
    ];
    const result = groupByPeriod(slots, "America/New_York");
    expect(result).toHaveLength(1);
    expect(result[0].period).toBe("morning");
  });

  it("handles a day with only one period", () => {
    const slots = [
      { start: "2026-06-01T14:00:00.000Z", label: fmtTime("2026-06-01T14:00:00.000Z", "America/New_York") },
      { start: "2026-06-01T15:00:00.000Z", label: fmtTime("2026-06-01T15:00:00.000Z", "America/New_York") },
    ];
    const result = groupByPeriod(slots, "America/New_York");
    expect(result).toHaveLength(1);
    expect(result[0].period).toBe("morning");
  });

  it("handles a DST fall-back day", () => {
    const slots = [
      { start: "2026-11-01T05:00:00.000Z", label: fmtTime("2026-11-01T05:00:00.000Z", "America/New_York") },
      { start: "2026-11-01T06:00:00.000Z", label: fmtTime("2026-11-01T06:00:00.000Z", "America/New_York") },
      { start: "2026-11-01T14:00:00.000Z", label: fmtTime("2026-11-01T14:00:00.000Z", "America/New_York") },
      { start: "2026-11-01T18:00:00.000Z", label: fmtTime("2026-11-01T18:00:00.000Z", "America/New_York") },
    ];
    const result = groupByPeriod(slots, "America/New_York");
    expect(result).toHaveLength(2);
    expect(result[0].period).toBe("morning");
    expect(result[0].slots).toHaveLength(3);
    expect(result[1].period).toBe("afternoon");
    expect(result[1].slots).toHaveLength(1);
  });
});