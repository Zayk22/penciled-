// src/app/booking/[token]/cancel/page.tsx
import { notFound } from "next/navigation";
import { db } from "@/db";
import { bookings } from "@/db/schema";
import { eq } from "drizzle-orm";
import { isValidTokenFormat, hashToken } from "@/lib/tokens";
import { Logo } from "@/components/Logo";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { cancelBooking } from "./actions";

export const dynamic = "force-dynamic";

export default async function CancelPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  if (!isValidTokenFormat(token)) {
    notFound();
  }

  const hash = hashToken(token);
  const result = await db.select().from(bookings).where(eq(bookings.manageTokenHash, hash)).limit(1);
  const booking = result[0];
  if (!booking) notFound();

  if (booking.isCancelled) {
    return (
      <div className="min-h-screen bg-paper flex flex-col items-center justify-center p-6">
        <Logo variant="full" className="mb-8" />
        <div className="text-center max-w-md">
          <h1 className="font-serif text-2xl mb-2">This booking is already cancelled</h1>
          <Link href={`/booking/${token}`}>
            <Button variant="secondary">Back to booking</Button>
          </Link>
        </div>
      </div>
    );
  }

  const dateString = new Intl.DateTimeFormat("en-US", {
    timeZone: booking.guestTimezone,
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(booking.startTime);

  return (
    <div className="min-h-screen bg-paper flex flex-col items-center justify-center p-6">
      <Logo variant="full" className="mb-8" />
      <div className="bg-surface border border-border rounded-md p-6 md:p-8 max-w-md w-full">
        <h1 className="font-serif text-2xl mb-4">Cancel this booking?</h1>
        <p className="text-muted mb-6">
          Are you sure you want to cancel <strong>{booking.eventTitleSnapshot}</strong> on {dateString}?
          This action cannot be undone.
        </p>
        <div className="flex flex-col gap-3">
          <form action={cancelBooking}>
            <input type="hidden" name="token" value={token} />
            <Button type="submit" variant="primary" className="w-full bg-error hover:bg-[#8a1d17] border-error text-paper">
              Yes, cancel booking
            </Button>
          </form>
          <Link href={`/booking/${token}`} className="w-full">
            <Button variant="secondary" className="w-full">Keep booking</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}