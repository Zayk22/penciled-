import { wallClockToUtc, utcToWallClock } from "../time";

export type EventTypeConfig = {
  durationMinutes: number;
  slotIntervalMinutes: number;
  bufferBeforeMinutes: number;
  bufferAfterMinutes: number;
  minNoticeMinutes: number;
  maxDaysAhead: number;
};

export type AvailabilityRule = {
  weekday: number;
  startTime: string;
  endTime: string;
};

export type DateOverride = {
  date: string;
  isBlocked: boolean;
  startTime?: string | null;
  endTime?: string | null;
};

export type ExistingBooking = {
  blockedStart: Date;
  blockedEnd: Date;
};

export type Slot = {
  start: Date;
  end: Date;
};

export type GenerateSlotsParams = {
  eventType: EventTypeConfig;
  availabilityRules: AvailabilityRule[];
  overrides: DateOverride[];
  existingBookings: ExistingBooking[];
  hostTimezone: string;
  guestTimezone: string; // Not used for slot generation, used for UI formatting
  now: Date;
};

export function generateSlots(params: GenerateSlotsParams): Slot[] {
  const { eventType, availabilityRules, overrides, existingBookings, hostTimezone, now } = params;
  const slots: Slot[] = [];
  const rangeEnd = new Date(now.getTime() + eventType.maxDaysAhead * 24 * 60 * 60 * 1000);
  const minNoticeCutoff = new Date(now.getTime() + eventType.minNoticeMinutes * 60 * 1000);

  // Start iterating from today in the host's timezone
  const nowInHostTz = new Date(now.toLocaleString("en-US", { timeZone: hostTimezone }));
  let currentDate = new Date(nowInHostTz.getFullYear(), nowInHostTz.getMonth(), nowInHostTz.getDate());

  while (currentDate <= rangeEnd) {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth() + 1;
    const day = currentDate.getDate();
    const weekday = currentDate.getDay();
    const dateStr = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

    let windows: { start: string; end: string }[] = [];
    const override = overrides.find((o) => o.date === dateStr);
    
    if (override) {
      if (!override.isBlocked && override.startTime && override.endTime) {
        windows = [{ start: override.startTime, end: override.endTime }];
      }
    } else {
      windows = availabilityRules
        .filter((r) => r.weekday === weekday)
        .map((r) => ({ start: r.startTime, end: r.endTime }));
    }

    for (const window of windows) {
      const [startHour, startMin] = window.start.split(":").map(Number);
      const [endHour, endMin] = window.end.split(":").map(Number);

      // Step through in *wall clock* minutes
      let currentWallClockMinutes = startHour * 60 + startMin;
      const endWallClockMinutes = endHour * 60 + endMin;

      while (currentWallClockMinutes + eventType.durationMinutes <= endWallClockMinutes) {
        const slotHour = Math.floor(currentWallClockMinutes / 60);
        const slotMin = currentWallClockMinutes % 60;

        const currentSlotStart = wallClockToUtc(year, month, day, slotHour, slotMin, hostTimezone);
        
        // DST Gap Policy: 
        // If we ask for 02:30 but that time doesn't exist, wallClockToUtc will return the next valid time (e.g., 03:30).
        // We can detect this by checking if the wall clock time of the returned Date matches what we asked for.
        const actualWallClock = utcToWallClock(currentSlotStart, hostTimezone);
        const expectedWallClock = `${String(slotHour).padStart(2, "0")}:${String(slotMin).padStart(2, "0")}`;

        if (actualWallClock !== expectedWallClock) {
          // Slot fell into a DST gap. Skip it per our documented policy.
          currentWallClockMinutes += eventType.slotIntervalMinutes;
          continue;
        }

        // DST Fall-back Policy: If we hit the ambiguous hour, wallClockToUtc returns the first occurrence.
        // We accept it as-is (deterministic).
        
        const currentSlotEnd = new Date(currentSlotStart.getTime() + eventType.durationMinutes * 60000);

        // Check min notice
        if (currentSlotStart >= minNoticeCutoff && currentSlotStart < rangeEnd) {
          // Check overlaps with buffers
          const proposedBlockedStart = new Date(currentSlotStart.getTime() - eventType.bufferBeforeMinutes * 60000);
          const proposedBlockedEnd = new Date(currentSlotEnd.getTime() + eventType.bufferAfterMinutes * 60000);

          const hasOverlap = existingBookings.some((booking) => {
            return (
              proposedBlockedStart.getTime() < booking.blockedEnd.getTime() &&
              booking.blockedStart.getTime() < proposedBlockedEnd.getTime()
            );
          });

          if (!hasOverlap) {
            slots.push({ start: currentSlotStart, end: currentSlotEnd });
          }
        }

        currentWallClockMinutes += eventType.slotIntervalMinutes;
      }
    }

    currentDate.setDate(currentDate.getDate() + 1);
  }

  return slots;
}