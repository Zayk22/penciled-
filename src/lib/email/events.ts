// src/lib/email/events.ts
import { db } from "@/db";
import { emailEvents } from "@/db/schema";
import { and, eq, sql } from "drizzle-orm";
import { sendEmail, EmailRecipient } from "./index";

const STALE_AFTER_MINUTES = 5;

export type EmailKind = "confirmed" | "rescheduled" | "cancelled";
export type EmailRole = "guest" | "host";

export async function tryClaimNew(
  bookingId: string,
  kind: EmailKind,
  role: EmailRole,
  sequence: number
): Promise<{ id: string } | null> {
  const rows = await db
    .insert(emailEvents)
    .values({
      bookingId,
      kind,
      recipientRole: role,
      bookingSequence: sequence,
    })
    .onConflictDoNothing()
    .returning({ id: emailEvents.id });
  return rows[0] ?? null;
}

export async function tryReclaimStale(
  bookingId: string,
  kind: EmailKind,
  role: EmailRole,
  sequence: number
): Promise<{ id: string } | null> {
  const rows = await db
    .update(emailEvents)
    .set({ createdAt: new Date() })
    .where(
      and(
        eq(emailEvents.bookingId, bookingId),
        eq(emailEvents.kind, kind),
        eq(emailEvents.recipientRole, role),
        eq(emailEvents.bookingSequence, sequence),
        eq(emailEvents.status, "pending"),
        sql`${emailEvents.createdAt} < now() - interval '${sql.raw(String(STALE_AFTER_MINUTES))} minutes'`
      )
    )
    .returning({ id: emailEvents.id });
  return rows[0] ?? null;
}

export async function tryRetryFailed(
  bookingId: string,
  kind: EmailKind,
  role: EmailRole,
  sequence: number
): Promise<{ id: string } | null> {
  // created_at = now() prevents the stale-reclaim from matching immediately.
  const rows = await db
    .update(emailEvents)
    .set({ status: "pending", createdAt: new Date() })
    .where(
      and(
        eq(emailEvents.bookingId, bookingId),
        eq(emailEvents.kind, kind),
        eq(emailEvents.recipientRole, role),
        eq(emailEvents.bookingSequence, sequence),
        eq(emailEvents.status, "failed")
      )
    )
    .returning({ id: emailEvents.id });
  return rows[0] ?? null;
}

export async function markSent(id: string, providerMessageId: string | null): Promise<void> {
  await db
    .update(emailEvents)
    .set({ status: "sent", sentAt: new Date(), providerMessageId })
    .where(eq(emailEvents.id, id));
}

export async function markFailed(id: string, errorCode: string): Promise<void> {
  await db
    .update(emailEvents)
    .set({ status: "failed", errorCode })
    .where(eq(emailEvents.id, id));
}

export type SendTrackedEmailParams = {
  bookingId: string;
  sequence: number;
  kind: EmailKind;
  role: EmailRole;
  to: EmailRecipient[];
  subject: string;
  html: string;
  text: string;
  replyTo?: EmailRecipient;
};

/**
 * Claim → send → mark. Safe to call multiple times; only one invocation wins the claim.
 * Failures are recorded in email_events but never thrown — callers should invoke this
 * from within `after()` or another best-effort context.
 */
export async function sendTrackedEmail(params: SendTrackedEmailParams): Promise<void> {
  const claimed = await tryClaimNew(params.bookingId, params.kind, params.role, params.sequence);
  let eventId: string | null = claimed ? claimed.id : null;

  if (!eventId) {
    // The row exists. If it is stale-pending, reclaim and send. If it is sent, do nothing.
    // If it is failed, do nothing here — a later cron retry will pick it up.
    const reclaimed = await tryReclaimStale(params.bookingId, params.kind, params.role, params.sequence);
    eventId = reclaimed ? reclaimed.id : null;
  }

  if (!eventId) {
    return; // Already sent, actively being sent, or failed (retry comes from Phase 6 cron).
  }

  const result = await sendEmail({
    to: params.to,
    subject: params.subject,
    html: params.html,
    text: params.text,
    replyTo: params.replyTo,
  });

  if (result.ok) {
    await markSent(eventId, result.messageId);
  } else {
    await markFailed(eventId, result.errorCode);
  }
}