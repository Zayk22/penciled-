// src/lib/email/templates.ts

export function stripNewlines(s: string): string {
  return s.replace(/[\r\n]+/g, " ");
}

export function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function formatDateInTz(date: Date, tz: string): string {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: tz,
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

function formatTimeInTz(date: Date, tz: string): string {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: tz,
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

function notesToHtml(notes: string): string {
  return escapeHtml(notes).replace(/\n/g, "<br>");
}

export type GuestConfirmationContext = {
  eventTitle: string;
  hostDisplayName: string;
  guestName: string;
  guestEmail: string;
  guestTimezone: string;
  startTime: Date;
  endTime: Date;
  durationMinutes: number;
  notes: string | null;
  manageUrl: string;
};

export function buildGuestConfirmation(ctx: GuestConfirmationContext): {
  subject: string;
  html: string;
  text: string;
} {
  const subject = `Your booking with ${stripNewlines(ctx.hostDisplayName)}`;

  const dateStr = formatDateInTz(ctx.startTime, ctx.guestTimezone);
  const startStr = formatTimeInTz(ctx.startTime, ctx.guestTimezone);
  const endStr = formatTimeInTz(ctx.endTime, ctx.guestTimezone);
  const tzLabel = ctx.guestTimezone.replace(/_/g, " ");

  const safeEventTitle = escapeHtml(ctx.eventTitle);
  const safeHostName = escapeHtml(ctx.hostDisplayName);
  const safeGuestName = escapeHtml(ctx.guestName);
  const safeNotes = ctx.notes ? notesToHtml(ctx.notes) : null;
  const safeManageUrl = escapeHtml(ctx.manageUrl);

  const html = `
    <div style="font-family:Georgia,serif;max-width:560px;margin:0 auto;padding:24px;color:#171512;">
      <h1 style="font-size:22px;margin:0 0 8px;">Your booking is confirmed</h1>
      <p style="color:#5E5B54;margin:0 0 24px;">${safeEventTitle}</p>
      <table style="width:100%;border-collapse:collapse;border:1px solid #E6E1D6;padding:16px;">
        <tr><td style="padding:12px 16px;font-weight:bold;">${dateStr}</td></tr>
        <tr><td style="padding:0 16px 12px;">${startStr} – ${endStr} (${durationMinutes(ctx.startTime, ctx.endTime)} minutes)</td></tr>
        <tr><td style="padding:0 16px 12px;color:#5E5B54;font-size:13px;">Times are shown in ${escapeHtml(tzLabel)}</td></tr>
      </table>
      <p style="margin:24px 0 4px;"><strong>Host:</strong> ${safeHostName}</p>
      <p style="margin:4px 0;"><strong>Guest:</strong> ${safeGuestName}</p>
      ${safeNotes ? `<p style="margin:16px 0 4px;"><strong>Notes:</strong></p><p style="margin:0;padding-left:12px;border-left:2px solid #E6E1D6;color:#5E5B54;">${safeNotes}</p>` : ""}
      <p style="margin:32px 0 4px;"><a href="${safeManageUrl}" style="color:#1E5B43;">View or manage your booking</a></p>
      <p style="margin:4px 0;color:#5E5B54;font-size:13px;">Keep this link to come back to your booking.</p>
    </div>
  `.trim();

  const text = [
    "Your booking is confirmed",
    "",
    ctx.eventTitle,
    `${dateStr}`,
    `${startStr} – ${endStr} (${ctx.durationMinutes} minutes)`,
    `Times are shown in ${tzLabel}`,
    "",
    `Host: ${ctx.hostDisplayName}`,
    `Guest: ${ctx.guestName}`,
    ctx.notes ? `\nNotes:\n${ctx.notes}` : "",
    "",
    `View or manage your booking: ${ctx.manageUrl}`,
    "Keep this link to come back to your booking.",
  ]
    .filter(Boolean)
    .join("\n");

  return { subject, html, text };
}

export type HostConfirmationContext = {
  eventTitle: string;
  hostDisplayName: string;
  hostTimezone: string;
  guestName: string;
  guestEmail: string;
  startTime: Date;
  endTime: Date;
  durationMinutes: number;
  notes: string | null;
};

export function buildHostConfirmation(ctx: HostConfirmationContext): {
  subject: string;
  html: string;
  text: string;
} {
  const subject = `New booking: ${stripNewlines(ctx.eventTitle)} with ${stripNewlines(ctx.guestName)}`;

  const dateStr = formatDateInTz(ctx.startTime, ctx.hostTimezone);
  const startStr = formatTimeInTz(ctx.startTime, ctx.hostTimezone);
  const endStr = formatTimeInTz(ctx.endTime, ctx.hostTimezone);
  const tzLabel = ctx.hostTimezone.replace(/_/g, " ");

  const safeEventTitle = escapeHtml(ctx.eventTitle);
  const safeGuestName = escapeHtml(ctx.guestName);
  const safeGuestEmail = escapeHtml(ctx.guestEmail);
  const safeNotes = ctx.notes ? notesToHtml(ctx.notes) : null;

  const html = `
    <div style="font-family:Georgia,serif;max-width:560px;margin:0 auto;padding:24px;color:#171512;">
      <h1 style="font-size:22px;margin:0 0 8px;">You have a new booking</h1>
      <p style="color:#5E5B54;margin:0 0 24px;">${safeEventTitle}</p>
      <table style="width:100%;border-collapse:collapse;border:1px solid #E6E1D6;padding:16px;">
        <tr><td style="padding:12px 16px;font-weight:bold;">${dateStr}</td></tr>
        <tr><td style="padding:0 16px 12px;">${startStr} – ${endStr} (${durationMinutes(ctx.startTime, ctx.endTime)} minutes)</td></tr>
        <tr><td style="padding:0 16px 12px;color:#5E5B54;font-size:13px;">Times are shown in ${escapeHtml(tzLabel)}</td></tr>
      </table>
      <p style="margin:24px 0 4px;"><strong>Guest:</strong> ${safeGuestName} (${safeGuestEmail})</p>
      ${safeNotes ? `<p style="margin:16px 0 4px;"><strong>Notes:</strong></p><p style="margin:0;padding-left:12px;border-left:2px solid #E6E1D6;color:#5E5B54;">${safeNotes}</p>` : ""}
    </div>
  `.trim();

  const text = [
    "You have a new booking",
    "",
    ctx.eventTitle,
    dateStr,
    `${startStr} – ${endStr} (${ctx.durationMinutes} minutes)`,
    `Times are shown in ${tzLabel}`,
    "",
    `Guest: ${ctx.guestName} (${ctx.guestEmail})`,
    ctx.notes ? `\nNotes:\n${ctx.notes}` : "",
  ]
    .filter(Boolean)
    .join("\n");

  return { subject, html, text };
}

function durationMinutes(start: Date, end: Date): number {
  return Math.round((end.getTime() - start.getTime()) / 60000);
}