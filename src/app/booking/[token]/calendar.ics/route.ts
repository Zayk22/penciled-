// src/app/booking/[token]/calendar.ics/route.ts
import { notFound } from "next/navigation";
import { db } from "@/db";
import { bookings } from "@/db/schema";
import { eq } from "drizzle-orm";
import { isValidTokenFormat, hashToken } from "@/lib/tokens";
import { buildIcs } from "@/lib/ics";

export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;

  if (!isValidTokenFormat(token)) {
    notFound();
  }

  const hash = hashToken(token);
  const result = await db
    .select()
    .from(bookings)
    .where(eq(bookings.manageTokenHash, hash))
    .limit(1);

  const booking = result[0];
  if (!booking) {
    notFound();
  }

  try {
    const ics = buildIcs({
      bookingId: booking.id,
      sequence: booking.sequence,
      startTime: booking.startTime,
      endTime: booking.endTime,
      isCancelled: booking.isCancelled,
      title: booking.eventTitleSnapshot,
      description: booking.notes,
      appUrl: process.env.NEXT_PUBLIC_APP_URL,
    });

    return new Response(ics, {
      headers: {
        "Content-Type": "text/calendar; charset=utf-8",
        "Content-Disposition": 'attachment; filename="booking.ics"',
        "Cache-Control": "no-store",
      },
    });
  } catch {
    return new Response("Configuration error: missing app URL", { status: 500 });
  }
}