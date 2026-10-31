// src/lib/ics/index.test.ts
import { describe, it, expect } from "vitest";
import { buildIcs } from "./index";

describe("buildIcs", () => {
  const base = {
    bookingId: "123e4567-e89b-12d3-a456-426614174000",
    sequence: 0,
    startTime: new Date("2026-06-01T14:00:00Z"),
    endTime: new Date("2026-06-01T14:30:00Z"),
    isCancelled: false,
    title: "Discovery Call",
    description: "A chat",
    appUrl: "https://penciled.app",
  };

  it("generates a valid ICS string", () => {
    const ics = buildIcs(base);
    expect(ics).toContain("BEGIN:VCALENDAR");
    expect(ics).toContain("VERSION:2.0");
    expect(ics).toContain("UID:123e4567-e89b-12d3-a456-426614174000@penciled.app");
    expect(ics).toContain("DTSTART:20260601T140000Z");
    expect(ics).toContain("DTEND:20260601T143000Z");
    expect(ics).toContain("STATUS:CONFIRMED");
    expect(ics).toContain("SUMMARY:Discovery Call");
  });

  it("escapes special characters", () => {
    const ics = buildIcs({ ...base, title: "Meeting, with; special\\chars\nand newline" });
    expect(ics).toContain("SUMMARY:Meeting\\, with\\; special\\\\chars\\nand newline");
  });

  it("folds lines longer than 75 octets", () => {
    const longTitle = "A".repeat(100);
    const ics = buildIcs({ ...base, title: longTitle });
    // The first line of the summary should be cut off with CRLF + space
    expect(ics).toMatch(/SUMMARY:([^\r\n]+)\r\n ([^\r\n]+)/);
  });

  it("throws if appUrl is missing", () => {
    expect(() => buildIcs({ ...base, appUrl: undefined })).toThrow(/required/);
  });

  it("sets STATUS to CANCELLED when isCancelled is true", () => {
    const ics = buildIcs({ ...base, isCancelled: true });
    expect(ics).toContain("STATUS:CANCELLED");
  });
});