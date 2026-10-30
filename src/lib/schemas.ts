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
  requestedStartTime: z.string().datetime(),
  guestName: z.string().min(1, "Name is required.").max(100),
  guestEmail: z.string().email("Must be a valid email."),
  guestTimezone: timezoneSchema,
  notes: z.string().max(500).optional().nullable(),
});