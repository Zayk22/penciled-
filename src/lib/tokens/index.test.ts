// src/lib/tokens/index.test.ts
import { describe, it, expect } from "vitest";
import { generateToken, hashToken, isValidTokenFormat, generateDerivedToken } from "./index";

describe("hashToken", () => {
  it("matches the known SHA-256 vector for 'abc'", () => {
    expect(hashToken("abc")).toBe(
      "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad"
    );
  });

  it("produces a 64-character lowercase hex string", () => {
    const hash = hashToken("hello world");
    expect(hash).toMatch(/^[0-9a-f]{64}$/);
    expect(hash.length).toBe(64);
  });
});

describe("generateToken", () => {
  it("returns a valid 64-char token and its matching hash", () => {
    const { token, hash } = generateToken();
    expect(token).toMatch(/^[0-9a-f]{64}$/);
    expect(hash).toBe(hashToken(token));
    expect(hash).toMatch(/^[0-9a-f]{64}$/);
  });

  it("returns different tokens on repeated calls", () => {
    const a = generateToken().token;
    const b = generateToken().token;
    expect(a).not.toBe(b);
  });
});

describe("isValidTokenFormat", () => {
  it("accepts a valid 64-char lowercase hex token", () => {
    expect(isValidTokenFormat("a".repeat(64))).toBe(true);
    expect(isValidTokenFormat("0123456789abcdef".repeat(4))).toBe(true);
    expect(isValidTokenFormat(generateToken().token)).toBe(true);
  });

  it("rejects strings that are too short", () => {
    expect(isValidTokenFormat("a".repeat(63))).toBe(false);
    expect(isValidTokenFormat("abc")).toBe(false);
  });

  it("rejects strings that are too long", () => {
    expect(isValidTokenFormat("a".repeat(65))).toBe(false);
  });

  it("rejects uppercase hex characters", () => {
    expect(isValidTokenFormat("A".repeat(64))).toBe(false);
    expect(isValidTokenFormat("0123456789ABCDEF".repeat(4))).toBe(false);
  });

  it("rejects non-hex characters", () => {
    expect(isValidTokenFormat("g".repeat(64))).toBe(false);
    expect(isValidTokenFormat("z".repeat(64))).toBe(false);
    expect(isValidTokenFormat(" ".repeat(64))).toBe(false);
    expect(isValidTokenFormat("!".repeat(64))).toBe(false);
  });

  it("rejects leading or trailing whitespace", () => {
    expect(isValidTokenFormat(" " + "a".repeat(64))).toBe(false);
    expect(isValidTokenFormat("a".repeat(64) + " ")).toBe(false);
    expect(isValidTokenFormat(" " + "a".repeat(64) + " ")).toBe(false);
  });

  it("rejects non-string inputs", () => {
    expect(isValidTokenFormat(undefined)).toBe(false);
    expect(isValidTokenFormat(null)).toBe(false);
    expect(isValidTokenFormat(0)).toBe(false);
    expect(isValidTokenFormat([])).toBe(false);
    expect(isValidTokenFormat({})).toBe(false);
    expect(isValidTokenFormat(true)).toBe(false);
  });
});

describe("generateDerivedToken", () => {
  const secret = "a".repeat(32);
  const bookingId = "123e4567-e89b-12d3-a456-426614174000";

  it("returns a deterministic 64-char token and its matching hash", () => {
    const { token, hash } = generateDerivedToken(bookingId, secret);
    expect(token).toMatch(/^[0-9a-f]{64}$/);
    expect(hash).toBe(hashToken(token));
  });

  it("produces the same token for the same booking ID and secret", () => {
    const a = generateDerivedToken(bookingId, secret).token;
    const b = generateDerivedToken(bookingId, secret).token;
    expect(a).toBe(b);
  });

  it("produces a different token for a different booking ID", () => {
    const a = generateDerivedToken(bookingId, secret).token;
    const b = generateDerivedToken("987e6543-e21b-12d3-a456-426614174000", secret).token;
    expect(a).not.toBe(b);
  });

  it("produces a different token for a different secret", () => {
    const a = generateDerivedToken(bookingId, secret).token;
    const b = generateDerivedToken(bookingId, "b".repeat(32)).token;
    expect(a).not.toBe(b);
  });

  it("throws if the secret is missing", () => {
    const originalEnv = process.env.BOOKING_TOKEN_SECRET;
    delete process.env.BOOKING_TOKEN_SECRET;
    
    expect(() => generateDerivedToken(bookingId)).toThrow(/missing or too short/);
    
    if (originalEnv) process.env.BOOKING_TOKEN_SECRET = originalEnv;
  });

  it("throws if the secret is too short", () => {
    expect(() => generateDerivedToken(bookingId, "short")).toThrow(/missing or too short/);
  });
});