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

// --- CONFIRMATION ---
export type GuestConfirmationContext = {
  eventTitle: string;
  hostDisplayName: string;
  guestName: string;
  guestTimezone: string;
  startTime: Date;
  endTime: Date;
  durationMinutes: number;
  notes: string | null;
  manageUrl: string;
};

export function buildGuestConfirmation(ctx: GuestConfirmationContext) {
  const subject = `Your booking with ${stripNewlines(ctx.hostDisplayName)}`;
  const dateStr = formatDateInTz(ctx.startTime, ctx.guestTimezone);
  const startStr = formatTimeInTz(ctx.startTime, ctx.guestTimezone);
  const endStr = formatTimeInTz(ctx.endTime, ctx.guestTimezone);
  const tzLabel = ctx.guestTimezone.replace(/_/g, " ");

  const html = `
    <div style="font-family:Georgia,serif;max-width:560px;margin:0 auto;padding:24px;color:#171512;">
      <h1 style="font-size:22px;margin:0 0 8px;">Your booking is confirmed</h1>
      <p style="color:#5E5B54;margin:0 0 24px;">${escapeHtml(ctx.eventTitle)}</p>
      <table style="width:100%;border-collapse:collapse;border:1px solid #E6E1D6;padding:16px;">
        <tr><td style="padding:12px 16px;font-weight:bold;">${dateStr}</td></tr>
        <tr><td style="padding:0 16px 12px;">${startStr} – ${endStr} (${ctx.durationMinutes} minutes)</td></tr>
        <tr><td style="padding:0 16px 12px;color:#5E5B54;font-size:13px;">Times are shown in ${escapeHtml(tzLabel)}</td></tr>
      </table>
      <p style="margin:24px 0 4px;"><strong>Host:</strong> ${escapeHtml(ctx.hostDisplayName)}</p>
      <p style="margin:4px 0;"><strong>Guest:</strong> ${escapeHtml(ctx.guestName)}</p>
      ${ctx.notes ? `<p style="margin:16px 0 4px;"><strong>Notes:</strong></p><p style="margin:0;padding-left:12px;border-left:2px solid #E6E1D6;color:#5E5B54;">${notesToHtml(ctx.notes)}</p>` : ""}
      <p style="margin:32px 0 4px;"><a href="${escapeHtml(ctx.manageUrl)}" style="color:#1E5B43;">View or manage your booking</a></p>
    </div>
  `.trim();

  const text = [
    "Your booking is confirmed",
    "",
    ctx.eventTitle,
    dateStr,
    `${startStr} – ${endStr} (${ctx.durationMinutes} minutes)`,
    `Times are shown in ${tzLabel}`,
    "",
    `Host: ${ctx.hostDisplayName}`,
    `Guest: ${ctx.guestName}`,
    ctx.notes ? `\nNotes:\n${ctx.notes}` : "",
    "",
    `View or manage your booking: ${ctx.manageUrl}`,
  ].filter(Boolean).join("\n");

  return { subject, html, text };
}

export type HostConfirmationContext = {
  eventTitle: string;
  hostTimezone: string;
  guestName: string;
  guestEmail: string;
  startTime: Date;
  endTime: Date;
  durationMinutes: number;
  notes: string | null;
};

export function buildHostConfirmation(ctx: HostConfirmationContext) {
  const subject = `New booking: ${stripNewlines(ctx.eventTitle)} with ${stripNewlines(ctx.guestName)}`;
  const dateStr = formatDateInTz(ctx.startTime, ctx.hostTimezone);
  const startStr = formatTimeInTz(ctx.startTime, ctx.hostTimezone);
  const endStr = formatTimeInTz(ctx.endTime, ctx.hostTimezone);
  const tzLabel = ctx.hostTimezone.replace(/_/g, " ");

  const html = `
    <div style="font-family:Georgia,serif;max-width:560px;margin:0 auto;padding:24px;color:#171512;">
      <h1 style="font-size:22px;margin:0 0 8px;">You have a new booking</h1>
      <p style="color:#5E5B54;margin:0 0 24px;">${escapeHtml(ctx.eventTitle)}</p>
      <table style="width:100%;border-collapse:collapse;border:1px solid #E6E1D6;padding:16px;">
        <tr><td style="padding:12px 16px;font-weight:bold;">${dateStr}</td></tr>
        <tr><td style="padding:0 16px 12px;">${startStr} – ${endStr} (${ctx.durationMinutes} minutes)</td></tr>
        <tr><td style="padding:0 16px 12px;color:#5E5B54;font-size:13px;">Times are shown in ${escapeHtml(tzLabel)}</td></tr>
      </table>
      <p style="margin:24px 0 4px;"><strong>Guest:</strong> ${escapeHtml(ctx.guestName)} (${escapeHtml(ctx.guestEmail)})</p>
      ${ctx.notes ? `<p style="margin:16px 0 4px;"><strong>Notes:</strong></p><p style="margin:0;padding-left:12px;border-left:2px solid #E6E1D6;color:#5E5B54;">${notesToHtml(ctx.notes)}</p>` : ""}
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
  ].filter(Boolean).join("\n");

  return { subject, html, text };
}

// --- CANCELLED ---
export type CancelledGuestContext = {
  eventTitle: string;
  hostDisplayName: string;
  guestName: string;
  guestTimezone: string;
  startTime: Date;
  endTime: Date;
};

export function buildCancelledGuestEmail(ctx: CancelledGuestContext) {
  const subject = `Booking cancelled: ${stripNewlines(ctx.eventTitle)}`;
  const dateStr = formatDateInTz(ctx.startTime, ctx.guestTimezone);
  const startStr = formatTimeInTz(ctx.startTime, ctx.guestTimezone);
  const endStr = formatTimeInTz(ctx.endTime, ctx.guestTimezone);
  const tzLabel = ctx.guestTimezone.replace(/_/g, " ");

  const html = `
    <div style="font-family:Georgia,serif;max-width:560px;margin:0 auto;padding:24px;color:#171512;">
      <h1 style="font-size:22px;margin:0 0 8px;">Your booking was cancelled</h1>
      <p style="color:#5E5B54;margin:0 0 24px;">${escapeHtml(ctx.eventTitle)}</p>
      <table style="width:100%;border-collapse:collapse;border:1px solid #E6E1D6;padding:16px;">
        <tr><td style="padding:12px 16px;font-weight:bold;">${dateStr}</td></tr>
        <tr><td style="padding:0 16px 12px;">${startStr} – ${endStr}</td></tr>
        <tr><td style="padding:0 16px 12px;color:#5E5B54;font-size:13px;">Times are shown in ${escapeHtml(tzLabel)}</td></tr>
      </table>
      <p style="margin:24px 0 4px;"><strong>Host:</strong> ${escapeHtml(ctx.hostDisplayName)}</p>
      <p style="margin:4px 0;"><strong>Guest:</strong> ${escapeHtml(ctx.guestName)}</p>
    </div>
  `.trim();

  const text = [
    "Your booking was cancelled",
    "",
    ctx.eventTitle,
    dateStr,
    `${startStr} – ${endStr}`,
    `Times are shown in ${tzLabel}`,
    "",
    `Host: ${ctx.hostDisplayName}`,
    `Guest: ${ctx.guestName}`,
  ].filter(Boolean).join("\n");

  return { subject, html, text };
}

export type CancelledHostContext = {
  eventTitle: string;
  guestName: string;
  guestEmail: string;
  hostTimezone: string;
  startTime: Date;
  endTime: Date;
};

export function buildCancelledHostEmail(ctx: CancelledHostContext) {
  const subject = `Booking cancelled: ${stripNewlines(ctx.eventTitle)} with ${stripNewlines(ctx.guestName)}`;
  const dateStr = formatDateInTz(ctx.startTime, ctx.hostTimezone);
  const startStr = formatTimeInTz(ctx.startTime, ctx.hostTimezone);
  const endStr = formatTimeInTz(ctx.endTime, ctx.hostTimezone);
  const tzLabel = ctx.hostTimezone.replace(/_/g, " ");

  const html = `
    <div style="font-family:Georgia,serif;max-width:560px;margin:0 auto;padding:24px;color:#171512;">
      <h1 style="font-size:22px;margin:0 0 8px;">The booking was cancelled</h1>
      <p style="color:#5E5B54;margin:0 0 24px;">${escapeHtml(ctx.eventTitle)}</p>
      <table style="width:100%;border-collapse:collapse;border:1px solid #E6E1D6;padding:16px;">
        <tr><td style="padding:12px 16px;font-weight:bold;">${dateStr}</td></tr>
        <tr><td style="padding:0 16px 12px;">${startStr} – ${endStr}</td></tr>
        <tr><td style="padding:0 16px 12px;color:#5E5B54;font-size:13px;">Times are shown in ${escapeHtml(tzLabel)}</td></tr>
      </table>
      <p style="margin:24px 0 4px;"><strong>Guest:</strong> ${escapeHtml(ctx.guestName)} (${escapeHtml(ctx.guestEmail)})</p>
    </div>
  `.trim();

  const text = [
    "The booking was cancelled",
    "",
    ctx.eventTitle,
    dateStr,
    `${startStr} – ${endStr}`,
    `Times are shown in ${tzLabel}`,
    "",
    `Guest: ${ctx.guestName} (${ctx.guestEmail})`,
  ].filter(Boolean).join("\n");

  return { subject, html, text };
}

// --- RESCHEDULED ---
export type RescheduledGuestContext = {
  eventTitle: string;
  hostDisplayName: string;
  guestName: string;
  guestTimezone: string;
  startTime: Date;
  endTime: Date;
  manageUrl: string;
};

export function buildRescheduledGuestEmail(ctx: RescheduledGuestContext) {
  const subject = `Booking rescheduled: ${stripNewlines(ctx.eventTitle)}`;
  const dateStr = formatDateInTz(ctx.startTime, ctx.guestTimezone);
  const startStr = formatTimeInTz(ctx.startTime, ctx.guestTimezone);
  const endStr = formatTimeInTz(ctx.endTime, ctx.guestTimezone);
  const tzLabel = ctx.guestTimezone.replace(/_/g, " ");

  const html = `
    <div style="font-family:Georgia,serif;max-width:560px;margin:0 auto;padding:24px;color:#171512;">
      <h1 style="font-size:22px;margin:0 0 8px;">Your booking was rescheduled</h1>
      <p style="color:#5E5B54;margin:0 0 24px;">${escapeHtml(ctx.eventTitle)}</p>
      <table style="width:100%;border-collapse:collapse;border:1px solid #E6E1D6;padding:16px;">
        <tr><td style="padding:12px 16px;font-weight:bold;">${dateStr}</td></tr>
        <tr><td style="padding:0 16px 12px;">${startStr} – ${endStr}</td></tr>
        <tr><td style="padding:0 16px 12px;color:#5E5B54;font-size:13px;">Times are shown in ${escapeHtml(tzLabel)}</td></tr>
      </table>
      <p style="margin:24px 0 4px;"><strong>Host:</strong> ${escapeHtml(ctx.hostDisplayName)}</p>
      <p style="margin:4px 0;"><strong>Guest:</strong> ${escapeHtml(ctx.guestName)}</p>
      <p style="margin:32px 0 4px;"><a href="${escapeHtml(ctx.manageUrl)}" style="color:#1E5B43;">View or manage your booking</a></p>
    </div>
  `.trim();

  const text = [
    "Your booking was rescheduled",
    "",
    ctx.eventTitle,
    dateStr,
    `${startStr} – ${endStr}`,
    `Times are shown in ${tzLabel}`,
    "",
    `Host: ${ctx.hostDisplayName}`,
    `Guest: ${ctx.guestName}`,
    "",
    `View or manage your booking: ${ctx.manageUrl}`,
  ].filter(Boolean).join("\n");

  return { subject, html, text };
}

export type RescheduledHostContext = {
  eventTitle: string;
  guestName: string;
  guestEmail: string;
  hostTimezone: string;
  startTime: Date;
  endTime: Date;
};

export function buildRescheduledHostEmail(ctx: RescheduledHostContext) {
  const subject = `Booking rescheduled: ${stripNewlines(ctx.eventTitle)} with ${stripNewlines(ctx.guestName)}`;
  const dateStr = formatDateInTz(ctx.startTime, ctx.hostTimezone);
  const startStr = formatTimeInTz(ctx.startTime, ctx.hostTimezone);
  const endStr = formatTimeInTz(ctx.endTime, ctx.hostTimezone);
  const tzLabel = ctx.hostTimezone.replace(/_/g, " ");

  const html = `
    <div style="font-family:Georgia,serif;max-width:560px;margin:0 auto;padding:24px;color:#171512;">
      <h1 style="font-size:22px;margin:0 0 8px;">The booking was rescheduled</h1>
      <p style="color:#5E5B54;margin:0 0 24px;">${escapeHtml(ctx.eventTitle)}</p>
      <table style="width:100%;border-collapse:collapse;border:1px solid #E6E1D6;padding:16px;">
        <tr><td style="padding:12px 16px;font-weight:bold;">${dateStr}</td></tr>
        <tr><td style="padding:0 16px 12px;">${startStr} – ${endStr}</td></tr>
        <tr><td style="padding:0 16px 12px;color:#5E5B54;font-size:13px;">Times are shown in ${escapeHtml(tzLabel)}</td></tr>
      </table>
      <p style="margin:24px 0 4px;"><strong>Guest:</strong> ${escapeHtml(ctx.guestName)} (${escapeHtml(ctx.guestEmail)})</p>
    </div>
  `.trim();

  const text = [
    "The booking was rescheduled",
    "",
    ctx.eventTitle,
    dateStr,
    `${startStr} – ${endStr}`,
    `Times are shown in ${tzLabel}`,
    "",
    `Guest: ${ctx.guestName} (${ctx.guestEmail})`,
  ].filter(Boolean).join("\n");

  return { subject, html, text };
}