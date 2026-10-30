// src/lib/availability/index.ts
import { wallClockToUtc, getTodayInTimezone } from "../time";

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
  guestTimezone: string;
  now: Date;
};

export function generateSlots(params: GenerateSlotsParams): Slot[] {
  const { eventType, availabilityRules, overrides, existingBookings, hostTimezone, now } = params;
  
  const normalizedRules = availabilityRules.map(r => ({
    ...r,
    startTime: r.startTime.substring(0, 5),
    endTime: r.endTime.substring(0, 5),
  }));
  
  const normalizedOverrides = overrides.map(o => ({
    ...o,
    startTime: o.startTime ? o.startTime.substring(0, 5) : null,
    endTime: o.endTime ? o.endTime.substring(0, 5) : null,
  }));

  const slots: Slot[] = [];
  const rangeEnd = new Date(now.getTime() + eventType.maxDaysAhead * 24 * 60 * 60 * 1000);
  const minNoticeCutoff = new Date(now.getTime() + eventType.minNoticeMinutes * 60 * 1000);

  const todayStr = getTodayInTimezone(hostTimezone, now);
  const [startY, startM, startD] = todayStr.split("-").map(Number);
  
  const currentUtcDate = new Date(Date.UTC(startY, startM - 1, startD));

  while (currentUtcDate <= rangeEnd) {
    const year = currentUtcDate.getUTCFullYear();
    const month = currentUtcDate.getUTCMonth() + 1;
    const day = currentUtcDate.getUTCDate();
    const weekday = currentUtcDate.getUTCDay();
    const dateStr = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

    let windows: { start: string; end: string }[] = [];
    const override = normalizedOverrides.find((o) => o.date === dateStr);
    
    if (override) {
      if (!override.isBlocked && override.startTime && override.endTime) {
        windows = [{ start: override.startTime, end: override.endTime }];
      }
    } else {
      windows = normalizedRules
        .filter((r) => r.weekday === weekday)
        .map((r) => ({ start: r.startTime, end: r.endTime }));
    }

    windows.sort((a, b) => a.start.localeCompare(b.start));
    const mergedWindows: { start: string; end: string }[] = [];
    for (const w of windows) {
      if (mergedWindows.length === 0) {
        mergedWindows.push({ ...w });
      } else {
        const last = mergedWindows[mergedWindows.length - 1];
        if (w.start <= last.end) {
          last.end = w.end > last.end ? w.end : last.end;
        } else {
          mergedWindows.push({ ...w });
        }
      }
    }
    windows = mergedWindows;

    for (const window of windows) {
      const [startHour, startMin] = window.start.split(":").map(Number);
      const [endHour, endMin] = window.end.split(":").map(Number);

      const windowStartUtc = wallClockToUtc(year, month, day, startHour, startMin, hostTimezone);
      const windowEndUtc = wallClockToUtc(year, month, day, endHour, endMin, hostTimezone);

      let currentSlotStart = new Date(windowStartUtc);

      while (currentSlotStart.getTime() + eventType.durationMinutes * 60000 <= windowEndUtc.getTime()) {
        const currentSlotEnd = new Date(currentSlotStart.getTime() + eventType.durationMinutes * 60000);

        if (currentSlotStart >= minNoticeCutoff && currentSlotStart < rangeEnd) {
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

        currentSlotStart = new Date(currentSlotStart.getTime() + eventType.slotIntervalMinutes * 60000);
      }
    }

    currentUtcDate.setUTCDate(currentUtcDate.getUTCDate() + 1);
  }

  return slots;
}