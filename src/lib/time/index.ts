// src/lib/time/index.ts

export function isValidTimezone(tz: string): boolean {
  if (tz === "UTC") return true;
  try {
    const supported = Intl.supportedValuesOf("timeZone");
    return supported.includes(tz);
  } catch {
    try {
      Intl.DateTimeFormat(undefined, { timeZone: tz });
      return true;
    } catch {
      return false;
    }
  }
}

export function getTodayInTimezone(timeZone: string, now: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}

export function getTimezoneOffsetMinutes(date: Date, timeZone: string): number {
  // Truncate to whole seconds to avoid fractional offsets
  const truncatedDate = new Date(Math.floor(date.getTime() / 1000) * 1000);
  
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  });

  const parts = formatter.formatToParts(truncatedDate);
  const getPart = (type: string) => parts.find(p => p.type === type)?.value || "0";

  const year = parseInt(getPart("year"), 10);
  const month = parseInt(getPart("month"), 10);
  const day = parseInt(getPart("day"), 10);
  const hour = parseInt(getPart("hour"), 10);
  const minute = parseInt(getPart("minute"), 10);
  const second = parseInt(getPart("second"), 10);

  const localTimeAsUtc = Date.UTC(year, month - 1, day, hour, minute, second);
  return (localTimeAsUtc - truncatedDate.getTime()) / 60000;
}

export function utcToWallClock(date: Date, timeZone: string): string {
  return date.toLocaleTimeString("en-GB", {
    timeZone,
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23"
  });
}

export function wallClockToUtc(
  year: number, month: number, day: number, 
  hour: number, minute: number, 
  timeZone: string
): Date {
  const isoStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}T${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}:00`;
  const baselineUtc = new Date(isoStr + "Z");

  const offsetBefore = getTimezoneOffsetMinutes(new Date(baselineUtc.getTime() - 86400000), timeZone);
  const offsetAfter = getTimezoneOffsetMinutes(new Date(baselineUtc.getTime() + 86400000), timeZone);

  if (offsetBefore === offsetAfter) {
    return new Date(baselineUtc.getTime() - offsetBefore * 60000);
  }

  const guess1 = new Date(baselineUtc.getTime() - offsetBefore * 60000);
  const guess2 = new Date(baselineUtc.getTime() - offsetAfter * 60000);

  const fmt1 = utcToWallClock(guess1, timeZone);
  const fmt2 = utcToWallClock(guess2, timeZone);
  const expected = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;

  if (fmt1 === expected) return guess1;
  if (fmt2 === expected) return guess2;

  let start = Math.min(guess1.getTime(), guess2.getTime());
  let end = Math.max(guess1.getTime(), guess2.getTime());
  
  // Ensure start and end are aligned to whole seconds
  start = Math.floor(start / 1000) * 1000;
  end = Math.ceil(end / 1000) * 1000;

  while (end - start > 1000) {
    const mid = Math.floor((start + end) / 2000) * 1000;
    if (getTimezoneOffsetMinutes(new Date(mid), timeZone) === offsetBefore) {
      start = mid;
    } else {
      end = mid;
    }
  }
  
  return new Date(end);
}