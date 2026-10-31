CREATE TABLE "email_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"booking_id" uuid NOT NULL,
	"kind" text NOT NULL,
	"recipient_role" text NOT NULL,
	"booking_sequence" integer NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"error_code" text,
	"provider_message_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"sent_at" timestamp with time zone,
	CONSTRAINT "email_events_unique" UNIQUE("booking_id","kind","recipient_role","booking_sequence"),
	CONSTRAINT "email_events_kind_check" CHECK ("email_events"."kind" IN ('confirmed', 'rescheduled', 'cancelled')),
	CONSTRAINT "email_events_role_check" CHECK ("email_events"."recipient_role" IN ('guest', 'host')),
	CONSTRAINT "email_events_status_check" CHECK ("email_events"."status" IN ('pending', 'sent', 'failed')),
	CONSTRAINT "email_events_error_check" CHECK ("email_events"."error_code" IS NULL OR length("email_events"."error_code") <= 64)
);
--> statement-breakpoint
ALTER TABLE "bookings" ADD COLUMN "sequence" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "email_events" ADD CONSTRAINT "email_events_booking_id_bookings_id_fk" FOREIGN KEY ("booking_id") REFERENCES "public"."bookings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "email_events_status_idx" ON "email_events" USING btree ("status");--> statement-breakpoint
ALTER TABLE "bookings" ADD CONSTRAINT "sequence_non_negative" CHECK ("bookings"."sequence" >= 0);