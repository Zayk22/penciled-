// src/lib/tokens/index.ts
import { randomBytes, createHash } from "node:crypto";

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