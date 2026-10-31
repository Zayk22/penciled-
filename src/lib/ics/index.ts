// src/lib/ics/index.ts

function escapeIcsText(text: string): string {
  return text
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\n/g, "\\n")
    .replace(/\r/g, "");
}

function foldLine(line: string): string {
  const maxOctets = 75;
  let result = "";
  let currentOctets = 0;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const charCode = line.charCodeAt(i);
    let octets = 1;
    if (charCode > 0x7f) {
      if (charCode > 0x7ff) octets = 3;
      else octets = 2;
    }

    if (currentOctets + octets > maxOctets) {
      result += "\r\n ";
      currentOctets = 1;
    }

    result += char;
    currentOctets += octets;
  }
  return result;
}

function toIcsDate(date: Date): string {
  return date.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
}

export type IcsParams = {
  bookingId: string;
  sequence: number;
  startTime: Date;
  endTime: Date;
  isCancelled: boolean;
  title: string;
  description: string | null;
  appUrl: string | undefined;
};

export function buildIcs(params: IcsParams): string {
  if (!params.appUrl) {
    throw new Error("NEXT_PUBLIC_APP_URL is required to build a stable ICS UID");
  }
  const host = new URL(params.appUrl).host;
  
  const now = new Date();
  const uid = `${params.bookingId}@${host}`;
  const status = params.isCancelled ? "CANCELLED" : "CONFIRMED";
  const dtstamp = toIcsDate(now);
  const dtstart = toIcsDate(params.startTime);
  const dtend = toIcsDate(params.endTime);

  const summary = escapeIcsText(params.title);
  const description = params.description ? escapeIcsText(params.description) : "";

  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Penciled//Booking//EN",
    "CALSCALE:GREGORIAN",
    "BEGIN:VEVENT",
    `UID:${uid}`,
    `DTSTAMP:${dtstamp}`,
    `DTSTART:${dtstart}`,
    `DTEND:${dtend}`,
    `SEQUENCE:${params.sequence}`,
    `STATUS:${status}`,
    `SUMMARY:${summary}`,
    `DESCRIPTION:${description}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ];

  return lines.map(foldLine).join("\r\n");
}