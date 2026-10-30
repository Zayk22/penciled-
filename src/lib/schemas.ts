// src/lib/schemas.ts
import { z } from "zod";
import { RESERVED_USERNAMES } from "./reserved-usernames";
import { isValidTimezone } from "./time";

const timezoneSchema = z.string().refine(isValidTimezone, {
  message: "Must be a valid IANA timezone string.",
});

const timeStringSchema = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/, {
  message: "Time must be in HH:MM format.",
});

export const onboardingSchema = z.object({
  username: z.string()
    .min(3, "Username must be at least 3 characters.")
    .max(30, "Username must be at most 30 characters.")
    .regex(/^[a-z0-9][a-z0-9-]{1,28}[a-z0-9]$/, "Username must be lowercase, alphanumeric, and can contain hyphens (but not at the start/end).")
    .refine((val) => !RESERVED_USERNAMES.has(val), {
      message: "This username is reserved.",
    }),
  displayName: z.string().min(1, "Display name is required.").max(50),
  timezone: timezoneSchema,
});

export const availabilityRuleSchema = z.object({
  weekday: z.coerce.number().int().min(0).max(6),
  startTime: timeStringSchema,
  endTime: timeStringSchema,
}).refine((data) => data.endTime.substring(0, 5) > data.startTime.substring(0, 5), {
  message: "End time must be after start time.",
  path: ["endTime"],
});

export const dateOverrideSchema = z.object({
  date: z.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Must be YYYY-MM-DD")
    .refine((val) => {
      const [y, m, d] = val.split("-").map(Number);
      const dateObj = new Date(Date.UTC(y, m - 1, d));
      return dateObj.getUTCFullYear() === y && dateObj.getUTCMonth() === m - 1 && dateObj.getUTCDate() === d;
    }, "Invalid calendar date"),
  isBlocked: z.coerce.boolean(),
  startTime: timeStringSchema.optional().nullable(),
  endTime: timeStringSchema.optional().nullable(),
}).refine((data) => {
  if (data.isBlocked) return true;
  if (!data.startTime || !data.endTime) return false;
  return data.endTime.substring(0, 5) > data.startTime.substring(0, 5);
}, {
  message: "End time must be after start time.",
  path: ["endTime"],
});

// Option lists for Event Types
export const DURATIONS = [15, 30, 45, 60, 90, 120] as const;
export const SLOT_INTERVALS = [15, 30, 60] as const;
export const BUFFERS = [0, 5, 10, 15, 30, 45, 60] as const;
export const MIN_NOTICES = [0, 60, 120, 240, 720, 1440, 2880] as const;
export const MAX_DAYS = [7, 14, 30, 60, 90] as const;

export const eventTypeSchema = z.object({
  title: z.string().min(1, "Title is required").max(100, "Title is too long"),
  slug: z.string()
    .min(1, "Slug is required")
    .max(60, "Slug cannot exceed 60 characters")
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug must be lowercase letters, numbers, and hyphens only."),
  description: z.preprocess(
    (val) => (typeof val === "string" && val.trim() === "" ? null : val),
    z.string().max(500, "Description cannot exceed 500 characters").nullable().optional()
  ),
  durationMinutes: z.coerce.number().refine((val) => (DURATIONS as readonly number[]).includes(val), "Invalid duration"),
  slotIntervalMinutes: z.coerce.number().refine((val) => (SLOT_INTERVALS as readonly number[]).includes(val), "Invalid interval"),
  bufferBeforeMinutes: z.coerce.number().refine((val) => (BUFFERS as readonly number[]).includes(val), "Invalid buffer"),
  bufferAfterMinutes: z.coerce.number().refine((val) => (BUFFERS as readonly number[]).includes(val), "Invalid buffer"),
  minNoticeMinutes: z.coerce.number().refine((val) => (MIN_NOTICES as readonly number[]).includes(val), "Invalid notice"),
  maxDaysAhead: z.coerce.number().refine((val) => (MAX_DAYS as readonly number[]).includes(val), "Invalid max days"),
  isActive: z.preprocess((val) => val === "on" || val === "true" || val === true, z.boolean()),
});

export const bookingRequestSchema = z.object({
  hostUsername: z.string(),
  eventSlug: z.string(),
  requestedStartTime: z.string().datetime(),
  guestName: z.string().min(1, "Name is required.").max(100),
  guestEmail: z.string().email("Must be a valid email."),
  guestTimezone: timezoneSchema,
  notes: z.string().max(500).optional().nullable(),
});