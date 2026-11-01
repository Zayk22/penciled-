# Penciled

A booking scheduler for people who meet across time zones. Share one link, set your weekly hours, and guests pick a time on their own clock.

**Live demo:** [https://penciled-amber.vercel.app](https://penciled-amber.vercel.app)

## Features

- **Host dashboard:** Set weekly availability, add date overrides, and create event types with custom durations, buffers, and notice periods.
- **Public profile:** Share a clean, typographic profile at `/[username]`.
- **Booking flow:** Guests see available slots in their own time zone, with no account required.
- **Emails:** Transactional confirmations, reschedule links, and cancel links sent via Brevo.
- **Reminders:** A daily cron job sends reminders 24 to 48 hours before a meeting.
- **ICS export:** Download `.ics` calendar files that respect reschedules and cancellations.

## Architecture

- **Framework:** Next.js 16 (App Router, React 19, Turbopack).
- **Styling:** Tailwind CSS v4 with custom theme tokens (paper, ink, forest green).
- **Database:** Neon Postgres (serverless) with Drizzle ORM.
- **Auth:** Clerk (hosts only; guests never sign up).
- **Emails:** Brevo via a custom adapter in `src/lib/email`.
- **Spam protection:** Cloudflare Turnstile.
- **Deployment:** Vercel (Hobby tier) with Vercel Cron.

## The Hard Parts

### 1. Time Zones and DST

Every moment is stored as a UTC `timestamptz`. Host availability is stored as wall-clock times (`09:00`) plus an IANA time zone string (e.g., `America/New_York`).

The `generateSlots` function is a pure function that:

1. Iterates through the host's calendar days in their local time zone.
2. Merges overlapping availability windows.
3. Steps through each window in **absolute UTC milliseconds**, not wall-clock minutes.

This absolute stepping ensures that the spring-forward gap (e.g., 02:00 becoming 03:00) naturally skips the missing hour, and the fall-back hour (e.g., 01:00 occurring twice) naturally offers slots for both occurrences. If a window starts inside a spring-forward gap, the helper resolves it to the first valid instant after the gap.

### 2. No Double Bookings

Double-booking is prevented at the **database level**, not just in application code.

The `bookings` table has a `blocked_start` and `blocked_end` (which include the event's before/after buffers). It uses a Postgres exclusion constraint:

```sql
ALTER TABLE bookings ADD CONSTRAINT no_host_overlap
EXCLUDE USING gist (
  host_id WITH =,
  tstzrange(blocked_start, blocked_end, '[)') WITH &&
) WHERE (NOT is_cancelled);
```

Even if two guests submit the exact same slot at the exact same millisecond, Postgres guarantees one succeeds and the other fails with error `23P01`. The application catches this and tells the guest to pick another time.

## Case Study

**The problem:** Existing schedulers handle time zones as an afterthought. "9 AM" often means "9 AM in the host's time zone", which confuses guests in other parts of the world, especially on DST transition days.

**The solution:** Penciled treats the guest's time zone as the primary interface. The host sets their hours in their own zone, but the engine generates absolute UTC slots. When the guest views the page, those UTC slots are grouped and formatted in the guest's local zone. Because the engine steps in absolute time, a guest in Auckland and a host in Los Angeles see the exact same physical moments in time, and the DST rules "just work" without special-casing.

**The trade-off:** Using absolute time stepping means the engine does not try to "shift" a 02:00 slot to 03:00 during a spring-forward. If a host's window starts at 02:00, the 02:00 slot is skipped, and the first slot offered is 03:00. This is a documented, deterministic choice that avoids infinite loops or ambiguous behavior.

## Known Limits

- **Emails:** Emails go through Brevo from a free-mail sender address, so they may land in spam. Authenticating a domain I own fixes that and is a configuration change behind the email adapter.
- **Brevo API Keys:** Brevo API keys expire after 90 days of inactivity and must be regenerated.
- **Sign-ups:** Sign-ups are open so you can test the dashboard. The public booking pages need no account.
- **Reminders:** Vercel Hobby allows one cron run per day, so reminders are not exactly 24 hours ahead.
- **Clerk:** Clerk runs on a development instance because `vercel.app` cannot host a production instance.

## Local Development

1. Clone the repo.
2. Install dependencies: `npm install`
3. Copy `.env.example` to `.env.local` and fill in the values (Neon DB, Clerk keys, Brevo API key, Turnstile test keys, generated tokens).
4. Run migrations: `npx drizzle-kit migrate`. (Note: The repo includes a custom migration that enables the `btree_gist` extension and creates the exclusion constraint).
5. Start the dev server: `npm run dev`

### Tests

- Unit tests (pure functions): `npm test`
- Integration tests (database concurrency, requires `ALLOW_INTEGRATION_TESTS=true` in `.env.local`): `npm run test:integration`

## Screenshots

### Landing Page
![Penciled Landing Page](./screenshots/landing-page.png)

### Public Booking Page
![Penciled Booking Page](./screenshots/booking-page.png)

### Host Dashboard
![Penciled Dashboard](./screenshots/dashboard.png)