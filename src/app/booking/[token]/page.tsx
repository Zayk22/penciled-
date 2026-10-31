// src/app/booking/[token]/page.tsx
import { notFound } from "next/navigation";
import { db } from "@/db";
import { bookings, hosts } from "@/db/schema";
import { eq } from "drizzle-orm";
import { isValidTokenFormat, hashToken } from "@/lib/tokens";
import { Logo } from "@/components/Logo";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { IconCheck } from "@/components/icons";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
  },
};

export default async function ConfirmationPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  if (!isValidTokenFormat(token)) {
    notFound();
  }

  const hash = hashToken(token);
  const result = await db
    .select({
      booking: bookings,
      hostName: hosts.displayName,
      hostUsername: hosts.username,
    })
    .from(bookings)
    .innerJoin(hosts, eq(bookings.hostId, hosts.id))
    .where(eq(bookings.manageTokenHash, hash))
    .limit(1);

  const data = result[0];
  if (!data) {
    notFound();
  }

  const { booking, hostName, hostUsername } = data;

  const dateString = new Intl.DateTimeFormat("en-US", {
    timeZone: booking.guestTimezone,
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(booking.startTime);

  const startTimeString = new Intl.DateTimeFormat("en-US", {
    timeZone: booking.guestTimezone,
    hour: "numeric",
    minute: "2-digit",
  }).format(booking.startTime);

  const endTimeString = new Intl.DateTimeFormat("en-US", {
    timeZone: booking.guestTimezone,
    hour: "numeric",
    minute: "2-digit",
  }).format(booking.endTime);

  const durationMinutes = Math.round((booking.endTime.getTime() - booking.startTime.getTime()) / 60000);

  return (
    <div className="min-h-screen bg-paper flex flex-col">
      <header className="border-b border-border bg-surface shrink-0">
        <div className="max-w-2xl mx-auto px-4 h-16 flex items-center justify-center">
          <Logo variant="full" size={24} />
        </div>
      </header>

      <main className="flex-1 w-full max-w-2xl mx-auto px-4 py-12">
        <div className="bg-surface border border-border rounded-md p-6 md:p-8">
          <div className="text-center mb-8 flex flex-col items-center">
            {!booking.isCancelled && (
              <div className="w-12 h-12 rounded-full border border-forest flex items-center justify-center text-forest mb-6" aria-hidden="true">
                <IconCheck width={24} height={24} />
              </div>
            )}
            <h1 className="font-serif text-3xl mb-2">
              {booking.isCancelled ? "This booking was cancelled" : "Your booking is confirmed"}
            </h1>
          </div>

          <div className="h-px bg-border mb-8" />

          <div className="flex flex-col gap-6">
            <div>
              <h2 className="font-serif text-xl mb-1">{booking.eventTitleSnapshot}</h2>
              <p className="text-muted text-sm">{durationMinutes} minutes</p>
            </div>

            <div className="bg-paper border border-border rounded-md p-4">
              <p className="font-medium text-ink">{dateString}</p>
              <p className="text-ink">{startTimeString} – {endTimeString}</p>
              <p className="text-xs text-muted mt-2">
                Times are shown in {booking.guestTimezone.replace(/_/g, " ")}
              </p>
            </div>

            <div className="flex flex-col gap-1">
              <p className="text-sm font-medium text-ink">Host</p>
              <p className="text-sm text-muted">{hostName}</p>
            </div>

            <div className="flex flex-col gap-1">
              <p className="text-sm font-medium text-ink">Guest</p>
              <p className="text-sm text-muted">{booking.guestName} ({booking.guestEmail})</p>
            </div>

            {booking.notes && (
              <div className="flex flex-col gap-1">
                <p className="text-sm font-medium text-ink">Notes</p>
                <p className="text-sm text-muted border-l-2 border-border pl-3 italic">
                  {booking.notes}
                </p>
              </div>
            )}
          </div>

          <div className="h-px bg-border my-8" />

          <div className="flex flex-col items-center gap-4">
            <p className="text-xs text-muted text-center">
              Keep this page&apos;s link to come back to your booking.
            </p>
            <Link href={`/${hostUsername}`}>
              <Button variant="secondary">Back to profile</Button>
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}