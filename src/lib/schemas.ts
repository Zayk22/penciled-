import { z } from "zod";
import { RESERVED_USERNAMES } from "./reserved-usernames";
import { isValidTimezone } from "./time";

// Shared validators
const timezoneSchema = z.string().refine(isValidTimezone, {
  message: "Must be a valid IANA timezone string.",
});

const timeStringSchema = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, {
  message: "Time must be in HH:mm format.",
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
  weekday: z.number().int().min(0).max(6),
  startTime: timeStringSchema,
  endTime: timeStringSchema,
}).refine((data) => data.endTime > data.startTime, {
  message: "End time must be after start time.",
  path: ["endTime"],
});

export const dateOverrideSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Must be YYYY-MM-DD"),
  isBlocked: z.boolean(),
  startTime: timeStringSchema.optional().nullable(),
  endTime: timeStringSchema.optional().nullable(),
}).refine((data) => {
  if (data.isBlocked) return data.startTime == null && data.endTime == null;
  return data.startTime != null && data.endTime != null && data.endTime > data.startTime;
}, {
  message: "Invalid override time range.",
  path: ["endTime"],
});

export const eventTypeSchema = z.object({
  title: z.string().min(1).max(100),
  slug: z.string().min(1).regex(/^[a-z0-9-]+$/, "Slug must be lowercase letters, numbers, and hyphens."),
  description: z.string().max(500).optional().nullable(),
  durationMinutes: z.number().int().positive(),
  slotIntervalMinutes: z.number().int().positive(),
  bufferBeforeMinutes: z.number().int().min(0),
  bufferAfterMinutes: z.number().int().min(0),
  minNoticeMinutes: z.number().int().min(0),
  maxDaysAhead: z.number().int().min(1),
  isActive: z.boolean().default(true),
});

export const bookingRequestSchema = z.object({
  hostUsername: z.string(),
  eventSlug: z.string(),
  // Note: startTime is an ISO string from the client, but we won't trust it yet
  requestedStartTime: z.string().datetime(),
  guestName: z.string().min(1, "Name is required.").max(100),
  guestEmail: z.string().email("Must be a valid email."),
  guestTimezone: timezoneSchema,
  notes: z.string().max(500).optional().nullable(),
});