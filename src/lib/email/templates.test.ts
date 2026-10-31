// src/lib/email/templates.test.ts
import { describe, it, expect } from "vitest";
import {
  stripNewlines,
  escapeHtml,
  buildGuestConfirmation,
  buildHostConfirmation,
} from "./templates";

describe("stripNewlines", () => {
  it("removes CRLF sequences from a subject-bound string", () => {
    expect(stripNewlines("test\r\nBcc: x@example.com")).not.toContain("\r");
    expect(stripNewlines("test\r\nBcc: x@example.com")).not.toContain("\n");
  });

  it("collapses consecutive newlines into a single space", () => {
    expect(stripNewlines("line1\n\nline2")).toBe("line1 line2");
  });

  it("returns the same string when no newlines are present", () => {
    expect(stripNewlines("normal")).toBe("normal");
  });
});

describe("escapeHtml", () => {
  it("escapes a script tag", () => {
    expect(escapeHtml("<script>alert(1)</script>")).toBe(
      "&lt;script&gt;alert(1)&lt;/script&gt;"
    );
  });

  it("escapes ampersands", () => {
    expect(escapeHtml("a & b")).toBe("a &amp; b");
  });

  it("escapes quotes", () => {
    expect(escapeHtml(`"quoted" 'single'`)).toBe(
      "&quot;quoted&quot; &#39;single&#39;"
    );
  });
});

describe("buildGuestConfirmation", () => {
  const baseCtx = {
    eventTitle: "Discovery call",
    hostDisplayName: "Jane Doe",
    guestName: "Bob Smith",
    guestEmail: "bob@example.com",
    guestTimezone: "America/New_York",
    startTime: new Date("2026-06-01T14:00:00Z"),
    endTime: new Date("2026-06-01T14:30:00Z"),
    durationMinutes: 30,
    notes: null,
    manageUrl: "https://penciled.app/booking/abc123",
  };

  it("does not include the host's email anywhere", () => {
    const out = buildGuestConfirmation(baseCtx);
    expect(out.html).not.toContain("jane@example.com");
    expect(out.text).not.toContain("jane@example.com");
    expect(out.html).toContain("Jane Doe");
  });

  it("strips CRLF from a malicious host display name in the subject", () => {
    const out = buildGuestConfirmation({
      ...baseCtx,
      hostDisplayName: "Jane\r\nBcc: attacker@example.com",
    });
    // The correct security property: no newlines in the subject (so no header injection).
    // The remaining "Bcc:" text is harmless — it is now part of the subject line.
    expect(out.subject).not.toContain("\r");
    expect(out.subject).not.toContain("\n");
    expect(out.subject).toBe("Your booking with Jane Bcc: attacker@example.com");
  });

  it("escapes an XSS payload in the guest name in the HTML body", () => {
    const out = buildGuestConfirmation({
      ...baseCtx,
      guestName: "<script>alert(1)</script>",
    });
    expect(out.html).not.toContain("<script>");
    expect(out.html).toContain("&lt;script&gt;alert(1)&lt;/script&gt;");
  });

  it("renders notes with escaped HTML and preserved line breaks", () => {
    const out = buildGuestConfirmation({
      ...baseCtx,
      notes: "Line one\nLine two <b>bold</b>",
    });
    expect(out.html).toContain("Line one<br>Line two &lt;b&gt;bold&lt;/b&gt;");
    expect(out.text).toContain("Line one\nLine two <b>bold</b>");
  });
});

describe("buildHostConfirmation", () => {
  const baseCtx = {
    eventTitle: "Discovery call",
    hostDisplayName: "Jane Doe",
    hostTimezone: "America/New_York",
    guestName: "Bob Smith",
    guestEmail: "bob@example.com",
    startTime: new Date("2026-06-01T14:00:00Z"),
    endTime: new Date("2026-06-01T14:30:00Z"),
    durationMinutes: 30,
    notes: null,
  };

  it("includes the guest email (host needs it to reply)", () => {
    const out = buildHostConfirmation(baseCtx);
    expect(out.html).toContain("bob@example.com");
    expect(out.text).toContain("bob@example.com");
  });

  it("strips CRLF from a malicious guest name in the subject", () => {
    const out = buildHostConfirmation({
      ...baseCtx,
      guestName: "Bob\r\nBcc: attacker@example.com",
    });
    expect(out.subject).not.toContain("\r");
    expect(out.subject).not.toContain("\n");
    expect(out.subject).toBe("New booking: Discovery call with Bob Bcc: attacker@example.com");
  });
});