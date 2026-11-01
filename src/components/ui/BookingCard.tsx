// src/components/ui/BookingCard.tsx
import { bookings } from "@/db/schema";
import { IconClose } from "@/components/icons";
import { cancelHostBooking } from "@/app/dashboard/bookings/actions";
import { Button } from "@/components/ui/Button";

type Booking = typeof bookings.$inferSelect;

export function BookingCard({ booking, isUpcoming }: { booking: Booking, isUpcoming: boolean }) {
  const dateString = new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(booking.startTime);

  const startTimeString = new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
  }).format(booking.startTime);

  const endTimeString = new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
  }).format(booking.endTime);

  const durationMinutes = Math.round((booking.endTime.getTime() - booking.startTime.getTime()) / 60000);

  return (
    <div className="flex flex-col md:flex-row md:items-start justify-between p-4 md:p-6 border border-border bg-surface rounded-md gap-4">
      <div className="flex-1">
        <div className="flex items-center gap-3 mb-2 flex-wrap">
          <h3 className="font-medium text-ink text-lg">{booking.eventTitleSnapshot}</h3>
          {booking.isCancelled ? (
            <span className="text-xs font-medium bg-error/10 text-error px-2 py-1 rounded">Cancelled</span>
          ) : (
            <span className="text-xs font-medium bg-forest/10 text-forest px-2 py-1 rounded">Confirmed</span>
          )}
        </div>
        
        <p className="text-sm text-ink">
          {dateString} · {startTimeString} – {endTimeString} <span className="text-muted">({durationMinutes} min)</span>
        </p>
        <p className="text-xs text-muted mt-1">
          Guest time zone: {booking.guestTimezone.replace(/_/g, " ")}
        </p>

        <div className="mt-4 flex flex-col gap-1">
          <p className="text-sm"><strong className="font-medium">Guest:</strong> {booking.guestName} <span className="text-muted">({booking.guestEmail})</span></p>
          {booking.notes && (
            <p className="text-sm text-muted border-l-2 border-border pl-3 italic mt-1">
              {booking.notes}
            </p>
          )}
        </div>
      </div>

      {isUpcoming && !booking.isCancelled && (
        <div className="shrink-0 md:pt-1">
          <form action={async () => {
            "use server";
            await cancelHostBooking(booking.id);
          }}>
            <button 
              type="submit" 
              className="flex items-center justify-center w-full md:w-auto px-4 min-h-[44px] text-sm font-medium text-error hover:bg-error/5 border border-transparent hover:border-error/20 rounded-md transition-colors"
            >
              <IconClose width={16} height={16} className="mr-2" />
              Cancel booking
            </button>
          </form>
        </div>
      )}
    </div>
  );
}