CREATE TABLE "availability_rules" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"host_id" uuid NOT NULL,
	"weekday" smallint NOT NULL,
	"start_time" time NOT NULL,
	"end_time" time NOT NULL,
	CONSTRAINT "weekday_range" CHECK ("availability_rules"."weekday" >= 0 AND "availability_rules"."weekday" <= 6),
	CONSTRAINT "time_range" CHECK ("availability_rules"."end_time" > "availability_rules"."start_time")
);
--> statement-breakpoint
CREATE TABLE "bookings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"event_type_id" uuid NOT NULL,
	"host_id" uuid NOT NULL,
	"guest_name" text NOT NULL,
	"guest_email" text NOT NULL,
	"guest_timezone" text NOT NULL,
	"notes" text,
	"start_time" timestamp with time zone NOT NULL,
	"end_time" timestamp with time zone NOT NULL,
	"event_title_snapshot" text NOT NULL,
	"buffer_before_minutes" integer NOT NULL,
	"buffer_after_minutes" integer NOT NULL,
	"blocked_start" timestamp with time zone NOT NULL,
	"blocked_end" timestamp with time zone NOT NULL,
	"is_cancelled" boolean DEFAULT false NOT NULL,
	"cancelled_at" timestamp with time zone,
	"manage_token_hash" text,
	"reminder_sent_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "bookings_manage_token_hash_unique" UNIQUE("manage_token_hash"),
	CONSTRAINT "time_order" CHECK ("bookings"."start_time" < "bookings"."end_time"),
	CONSTRAINT "blocked_time_order" CHECK ("bookings"."blocked_start" < "bookings"."blocked_end"),
	CONSTRAINT "blocked_encompasses" CHECK ("bookings"."blocked_start" <= "bookings"."start_time" AND "bookings"."end_time" <= "bookings"."blocked_end"),
	CONSTRAINT "buffers_non_negative" CHECK ("bookings"."buffer_before_minutes" >= 0 AND "bookings"."buffer_after_minutes" >= 0),
	CONSTRAINT "buffer_math_check" CHECK (
    "bookings"."blocked_start" = "bookings"."start_time" - make_interval(mins => "bookings"."buffer_before_minutes") AND
    "bookings"."blocked_end" = "bookings"."end_time" + make_interval(mins => "bookings"."buffer_after_minutes")
  )
);
--> statement-breakpoint
CREATE TABLE "date_overrides" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"host_id" uuid NOT NULL,
	"date" date NOT NULL,
	"is_blocked" boolean DEFAULT false NOT NULL,
	"start_time" time,
	"end_time" time,
	CONSTRAINT "override_times_check" CHECK (
    ("date_overrides"."is_blocked" = true AND "date_overrides"."start_time" IS NULL AND "date_overrides"."end_time" IS NULL) OR
    ("date_overrides"."is_blocked" = false AND "date_overrides"."start_time" IS NOT NULL AND "date_overrides"."end_time" IS NOT NULL AND "date_overrides"."end_time" > "date_overrides"."start_time")
  )
);
--> statement-breakpoint
CREATE TABLE "event_types" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"host_id" uuid NOT NULL,
	"title" text NOT NULL,
	"slug" text NOT NULL,
	"description" text,
	"duration_minutes" integer NOT NULL,
	"slot_interval_minutes" integer DEFAULT 30 NOT NULL,
	"buffer_before_minutes" integer DEFAULT 0 NOT NULL,
	"buffer_after_minutes" integer DEFAULT 0 NOT NULL,
	"min_notice_minutes" integer DEFAULT 0 NOT NULL,
	"max_days_ahead" integer DEFAULT 30 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	CONSTRAINT "event_types_id_host_unique" UNIQUE("id","host_id"),
	CONSTRAINT "duration_positive" CHECK ("event_types"."duration_minutes" > 0),
	CONSTRAINT "interval_positive" CHECK ("event_types"."slot_interval_minutes" > 0),
	CONSTRAINT "buffers_non_negative" CHECK ("event_types"."buffer_before_minutes" >= 0 AND "event_types"."buffer_after_minutes" >= 0),
	CONSTRAINT "notice_non_negative" CHECK ("event_types"."min_notice_minutes" >= 0),
	CONSTRAINT "max_days_positive" CHECK ("event_types"."max_days_ahead" >= 1)
);
--> statement-breakpoint
CREATE TABLE "hosts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"clerk_user_id" text NOT NULL,
	"username" text NOT NULL,
	"display_name" text NOT NULL,
	"timezone" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "hosts_clerk_user_id_unique" UNIQUE("clerk_user_id")
);
--> statement-breakpoint
ALTER TABLE "availability_rules" ADD CONSTRAINT "availability_rules_host_id_hosts_id_fk" FOREIGN KEY ("host_id") REFERENCES "public"."hosts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_event_type_host_fk" FOREIGN KEY ("event_type_id","host_id") REFERENCES "public"."event_types"("id","host_id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_host_fk" FOREIGN KEY ("host_id") REFERENCES "public"."hosts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "date_overrides" ADD CONSTRAINT "date_overrides_host_id_hosts_id_fk" FOREIGN KEY ("host_id") REFERENCES "public"."hosts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_types" ADD CONSTRAINT "event_types_host_id_hosts_id_fk" FOREIGN KEY ("host_id") REFERENCES "public"."hosts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "availability_host_weekday_idx" ON "availability_rules" USING btree ("host_id","weekday");--> statement-breakpoint
CREATE INDEX "bookings_host_idx" ON "bookings" USING btree ("host_id");--> statement-breakpoint
CREATE INDEX "bookings_host_start_idx" ON "bookings" USING btree ("host_id","start_time");--> statement-breakpoint
CREATE UNIQUE INDEX "date_overrides_host_date_idx" ON "date_overrides" USING btree ("host_id","date");--> statement-breakpoint
CREATE UNIQUE INDEX "event_types_host_slug_idx" ON "event_types" USING btree ("host_id","slug");--> statement-breakpoint
CREATE INDEX "event_types_host_idx" ON "event_types" USING btree ("host_id");--> statement-breakpoint
CREATE UNIQUE INDEX "hosts_username_lower_idx" ON "hosts" USING btree (lower("username"));