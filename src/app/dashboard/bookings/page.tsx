// src/app/dashboard/bookings/page.tsx
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { hosts, bookings } from "@/db/schema";
import { eq, desc, asc } from "drizzle-orm";
import { EmptyState } from "@/components/ui/States";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { BookingCard } from "@/components/ui/BookingCard";

export default async function BookingsPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const hostResult = await db.select().from(hosts).where(eq(hosts.clerkUserId, userId)).limit(1);
  const host = hostResult[0];
  if (!host) redirect("/onboarding");

  // Fetch all bookings, sorted
  const allBookings = await db
    .select()
    .from(bookings)
    .where(eq(bookings.hostId, host.id))
    .orderBy(desc(bookings.startTime));

  const now = new Date();
  
  // Upcoming: starts in the future, not cancelled. Sort ascending (soonest first).
  const upcoming = allBookings
    .filter(b => b.startTime >= now && !b.isCancelled)
    .sort((a, b) => a.startTime.getTime() - b.startTime.getTime());

  // Past: starts in the past OR is cancelled. Sort descending (most recent first).
  const past = allBookings
    .filter(b => b.startTime < now || b.isCancelled)
    .sort((a, b) => b.startTime.getTime() - a.startTime.getTime());

  return (
    <div className="flex flex-col gap-8 max-w-4xl mx-auto w-full">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl mb-2">Bookings</h1>
          <p className="text-muted text-sm">View and manage your scheduled meetings.</p>
        </div>
        <Link href={`/${host.username}`}>
          <Button variant="secondary">View public profile</Button>
        </Link>
      </div>

      <div className="flex flex-col gap-4">
        <h2 className="font-serif text-xl border-b border-border pb-2">Upcoming</h2>
        {upcoming.length === 0 ? (
          <EmptyState 
            title="No upcoming bookings" 
            description="When someone books a time with you, it will appear here."
          />
        ) : (
          <div className="flex flex-col gap-4">
            {upcoming.map((booking) => (
              <BookingCard key={booking.id} booking={booking} isUpcoming={true} />
            ))}
          </div>
        )}
      </div>

      <div className="flex flex-col gap-4 mt-8">
        <h2 className="font-serif text-xl border-b border-border pb-2">Past and cancelled</h2>
        {past.length === 0 ? (
          <div className="p-6 border border-dashed border-border-strong rounded-md text-center">
            <p className="text-muted text-sm">No past bookings.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-4 opacity-75">
            {past.map((booking) => (
              <BookingCard key={booking.id} booking={booking} isUpcoming={false} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}