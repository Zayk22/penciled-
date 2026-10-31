// src/db/schema.ts
import { pgTable, uuid, text, timestamp, boolean, integer, smallint, time, date, uniqueIndex, index, check, foreignKey, unique } from "drizzle-orm/pg-core";
import { sql, relations } from "drizzle-orm";

// --- HOSTS ---
export const hosts = pgTable("hosts", {
  id: uuid("id").primaryKey().defaultRandom(),
  clerkUserId: text("clerk_user_id").notNull().unique(),
  username: text("username").notNull(),
  displayName: text("display_name").notNull(),
  timezone: text("timezone").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  uniqueIndex("hosts_username_lower_idx").on(sql`lower(${table.username})`),
]);

// --- AVAILABILITY RULES ---
export const availabilityRules = pgTable("availability_rules", {
  id: uuid("id").primaryKey().defaultRandom(),
  hostId: uuid("host_id").notNull().references(() => hosts.id, { onDelete: "cascade" }),
  weekday: smallint("weekday").notNull(),
  startTime: time("start_time").notNull(),
  endTime: time("end_time").notNull(),
}, (table) => [
  index("availability_host_weekday_idx").on(table.hostId, table.weekday),
  check("weekday_range", sql`${table.weekday} >= 0 AND ${table.weekday} <= 6`),
  check("time_range", sql`${table.endTime} > ${table.startTime}`),
]);

// --- DATE OVERRIDES ---
export const dateOverrides = pgTable("date_overrides", {
  id: uuid("id").primaryKey().defaultRandom(),
  hostId: uuid("host_id").notNull().references(() => hosts.id, { onDelete: "cascade" }),
  date: date("date").notNull(),
  isBlocked: boolean("is_blocked").default(false).notNull(),
  startTime: time("start_time"),
  endTime: time("end_time"),
}, (table) => [
  uniqueIndex("date_overrides_host_date_idx").on(table.hostId, table.date),
  check("override_times_check", sql`
    (${table.isBlocked} = true AND ${table.startTime} IS NULL AND ${table.endTime} IS NULL) OR
    (${table.isBlocked} = false AND ${table.startTime} IS NOT NULL AND ${table.endTime} IS NOT NULL AND ${table.endTime} > ${table.startTime})
  `),
]);

// --- EVENT TYPES ---
export const eventTypes = pgTable("event_types", {
  id: uuid("id").primaryKey().defaultRandom(),
  hostId: uuid("host_id").notNull().references(() => hosts.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  slug: text("slug").notNull(),
  description: text("description"),
  durationMinutes: integer("duration_minutes").notNull(),
  slotIntervalMinutes: integer("slot_interval_minutes").default(30).notNull(),
  bufferBeforeMinutes: integer("buffer_before_minutes").default(0).notNull(),
  bufferAfterMinutes: integer("buffer_after_minutes").default(0).notNull(),
  minNoticeMinutes: integer("min_notice_minutes").default(0).notNull(),
  maxDaysAhead: integer("max_days_ahead").default(30).notNull(),
  isActive: boolean("is_active").default(true).notNull(),
}, (table) => [
  uniqueIndex("event_types_host_slug_idx").on(table.hostId, table.slug),
  index("event_types_host_idx").on(table.hostId),
  unique("event_types_id_host_unique").on(table.id, table.hostId),
  check("duration_positive", sql`${table.durationMinutes} > 0`),
  check("interval_positive", sql`${table.slotIntervalMinutes} > 0`),
  check("buffers_non_negative", sql`${table.bufferBeforeMinutes} >= 0 AND ${table.bufferAfterMinutes} >= 0`),
  check("notice_non_negative", sql`${table.minNoticeMinutes} >= 0`),
  check("max_days_positive", sql`${table.maxDaysAhead} >= 1`),
]);

// --- BOOKINGS ---
export const bookings = pgTable("bookings", {
  id: uuid("id").primaryKey().defaultRandom(),
  eventTypeId: uuid("event_type_id").notNull(),
  hostId: uuid("host_id").notNull(),
  guestName: text("guest_name").notNull(),
  guestEmail: text("guest_email").notNull(),
  guestTimezone: text("guest_timezone").notNull(),
  notes: text("notes"),
  
  startTime: timestamp("start_time", { withTimezone: true }).notNull(),
  endTime: timestamp("end_time", { withTimezone: true }).notNull(),
  
  eventTitleSnapshot: text("event_title_snapshot").notNull(),
  bufferBeforeMinutes: integer("buffer_before_minutes").notNull(),
  bufferAfterMinutes: integer("buffer_after_minutes").notNull(),
  
  blockedStart: timestamp("blocked_start", { withTimezone: true }).notNull(),
  blockedEnd: timestamp("blocked_end", { withTimezone: true }).notNull(),
  
  isCancelled: boolean("is_cancelled").default(false).notNull(),
  cancelledAt: timestamp("cancelled_at", { withTimezone: true }),
  manageTokenHash: text("manage_token_hash").unique(),
  reminderSentAt: timestamp("reminder_sent_at", { withTimezone: true }),
  sequence: integer("sequence").default(0).notNull(),
  
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index("bookings_host_idx").on(table.hostId),
  index("bookings_host_start_idx").on(table.hostId, table.startTime),
  
  foreignKey({
    columns: [table.eventTypeId, table.hostId],
    foreignColumns: [eventTypes.id, eventTypes.hostId],
    name: "bookings_event_type_host_fk"
  }).onDelete("restrict"),
  
  foreignKey({
    columns: [table.hostId],
    foreignColumns: [hosts.id],
    name: "bookings_host_fk"
  }).onDelete("cascade"),

  check("time_order", sql`${table.startTime} < ${table.endTime}`),
  check("blocked_time_order", sql`${table.blockedStart} < ${table.blockedEnd}`),
  check("blocked_encompasses", sql`${table.blockedStart} <= ${table.startTime} AND ${table.endTime} <= ${table.blockedEnd}`),
  check("buffers_non_negative", sql`${table.bufferBeforeMinutes} >= 0 AND ${table.bufferAfterMinutes} >= 0`),
  check("buffer_math_check", sql`
    ${table.blockedStart} = ${table.startTime} - make_interval(mins => ${table.bufferBeforeMinutes}) AND
    ${table.blockedEnd} = ${table.endTime} + make_interval(mins => ${table.bufferAfterMinutes})
  `),
  check("sequence_non_negative", sql`${table.sequence} >= 0`),
]);

// --- EMAIL EVENTS ---
export const emailEvents = pgTable("email_events", {
  id: uuid("id").primaryKey().defaultRandom(),
  bookingId: uuid("booking_id").notNull().references(() => bookings.id, { onDelete: "cascade" }),
  kind: text("kind").notNull(),
  recipientRole: text("recipient_role").notNull(),
  bookingSequence: integer("booking_sequence").notNull(),
  status: text("status").default("pending").notNull(),
  errorCode: text("error_code"),
  providerMessageId: text("provider_message_id"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  sentAt: timestamp("sent_at", { withTimezone: true }),
}, (table) => [
  unique("email_events_unique").on(table.bookingId, table.kind, table.recipientRole, table.bookingSequence),
  index("email_events_status_idx").on(table.status),
  check("email_events_kind_check", sql`${table.kind} IN ('confirmed', 'rescheduled', 'cancelled')`),
  check("email_events_role_check", sql`${table.recipientRole} IN ('guest', 'host')`),
  check("email_events_status_check", sql`${table.status} IN ('pending', 'sent', 'failed')`),
  check("email_events_error_check", sql`${table.errorCode} IS NULL OR length(${table.errorCode}) <= 64`),
]);

// --- RELATIONS ---
export const hostsRelations = relations(hosts, ({ many }) => ({
  eventTypes: many(eventTypes),
  availabilityRules: many(availabilityRules),
  dateOverrides: many(dateOverrides),
  bookings: many(bookings),
}));

export const eventTypesRelations = relations(eventTypes, ({ one, many }) => ({
  host: one(hosts, {
    fields: [eventTypes.hostId],
    references: [hosts.id],
  }),
  bookings: many(bookings),
}));

export const bookingsRelations = relations(bookings, ({ one, many }) => ({
  host: one(hosts, {
    fields: [bookings.hostId],
    references: [hosts.id],
  }),
  eventType: one(eventTypes, {
    fields: [bookings.eventTypeId, bookings.hostId],
    references: [eventTypes.id, eventTypes.hostId],
  }),
  emailEvents: many(emailEvents),
}));

export const emailEventsRelations = relations(emailEvents, ({ one }) => ({
  booking: one(bookings, {
    fields: [emailEvents.bookingId],
    references: [bookings.id],
  }),
}));