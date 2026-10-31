// src/lib/tokens/index.ts
import { randomBytes, createHash, createHmac } from "node:crypto";

const TOKEN_BYTES = 32;
const TOKEN_REGEX = /^[0-9a-f]{64}$/;

export function generateToken(): { token: string; hash: string } {
  const token = randomBytes(TOKEN_BYTES).toString("hex");
  return { token, hash: hashToken(token) };
}

export function hashToken(token: string): string {
  return createHash("sha256").update(token, "utf8").digest("hex");
}

export function isValidTokenFormat(value: unknown): boolean {
  if (typeof value !== "string") return false;
  return TOKEN_REGEX.test(value);
}

/**
 * Derives a deterministic token from a booking ID and the BOOKING_TOKEN_SECRET.
 * 
 * Trade-off: If the secret leaks, an attacker who also knows a booking ID can rebuild
 * that booking's raw token. Booking IDs are UUIDs (not enumerable), and the database only
 * stores hashes, so the practical exposure is limited to bookings whose IDs are already known.
 * Rotating the secret invalidates all future derived tokens but does not affect existing
 * bookings (their stored hashes remain valid).
 */
export function generateDerivedToken(
  bookingId: string,
  secretOverride?: string
): { token: string; hash: string } {
  const secret = secretOverride || process.env.BOOKING_TOKEN_SECRET;
  
  if (!secret || secret.length < 32) {
    throw new Error("BOOKING_TOKEN_SECRET is missing or too short (min 32 chars)");
  }

  const token = createHmac("sha256", secret)
    .update(`manage:${bookingId}`)
    .digest("hex");

  return { token, hash: hashToken(token) };
}