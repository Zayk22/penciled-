-- Custom SQL migration file, put your code below! --
CREATE EXTENSION IF NOT EXISTS btree_gist;

ALTER TABLE "bookings" ADD CONSTRAINT "no_host_overlap"
EXCLUDE USING gist (
  "host_id" WITH =,
  tstzrange("blocked_start", "blocked_end", '[)') WITH &&
) WHERE (NOT "is_cancelled");