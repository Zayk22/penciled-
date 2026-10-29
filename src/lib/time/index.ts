/**
 * Validates if a string is a supported IANA time zone.
 */
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

/**
 * Robustly extracts the timezone offset for a given UTC date and IANA timezone.
 */
export function getTimezoneOffsetMinutes(date: Date, timeZone: string): number {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });

  const parts = formatter.formatToParts(date);
  const getPart = (type: string) => parts.find(p => p.type === type)?.value || "0";

  const year = parseInt(getPart("year"), 10);
  const month = parseInt(getPart("month"), 10);
  const day = parseInt(getPart("day"), 10);
  const hour = parseInt(getPart("hour"), 10);
  const minute = parseInt(getPart("minute"), 10);
  const second = parseInt(getPart("second"), 10);

  // Construct a UTC date from the local time parts
  const localTimeAsUtc = Date.UTC(year, month - 1, day, hour, minute, second);
  
  // The difference between the local time (interpreted as UTC) and the actual UTC date is the offset
  return (localTimeAsUtc - date.getTime()) / 60000;
}

/**
 * Converts a wall-clock time in a specific timezone to a UTC Date.
 */
export function wallClockToUtc(
  year: number, month: number, day: number, 
  hour: number, minute: number, 
  timeZone: string
): Date {
  const isoStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}T${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}:00`;
  
  // 1. Create a baseline date as if the wall clock was UTC
  const baselineUtc = new Date(isoStr + "Z");
  
  // 2. Find the offset at that baseline
  const offset1 = getTimezoneOffsetMinutes(baselineUtc, timeZone);
  
  // 3. Adjust by the offset
  let actualUtc = new Date(baselineUtc.getTime() - offset1 * 60000);
  
  // 4. Because of DST shifts, the offset might have changed at the new actualUtc. 
  // We do a second pass to ensure accuracy.
  const offset2 = getTimezoneOffsetMinutes(actualUtc, timeZone);
  
  if (offset1 !== offset2) {
    actualUtc = new Date(baselineUtc.getTime() - offset2 * 60000);
  }
  
  return actualUtc;
}

/**
 * Formats a UTC Date into a wall-clock time string (HH:mm) in the given timezone.
 */
export function utcToWallClock(date: Date, timeZone: string): string {
  return date.toLocaleTimeString("en-GB", {
    timeZone,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false
  });
}