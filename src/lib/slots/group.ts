// src/lib/slots/group.ts

export type RawSlot = { start: string; end: string };

export type GroupedDay = {
  date: string; // YYYY-MM-DD in guest tz
  label: string; // e.g. "Mon, Nov 3"
  month: string; // e.g. "Nov"
  slots: { start: string; label: string }[];
};

export function groupSlotsByDay(slots: RawSlot[], guestTimeZone: string): GroupedDay[] {
  const grouped = new Map<string, { date: Date; slots: RawSlot[] }>();

  for (const slot of slots) {
    const date = new Date(slot.start);
    const dateStr = new Intl.DateTimeFormat("en-CA", {
      timeZone: guestTimeZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(date);

    if (!grouped.has(dateStr)) {
      grouped.set(dateStr, { date, slots: [] });
    }
    grouped.get(dateStr)!.slots.push(slot);
  }

  return Array.from(grouped.entries())
    .map(([dateStr, data]) => {
      const label = new Intl.DateTimeFormat("en-US", {
        timeZone: guestTimeZone,
        weekday: "short",
        month: "short",
        day: "numeric",
      }).format(data.date);

      const month = new Intl.DateTimeFormat("en-US", {
        timeZone: guestTimeZone,
        month: "short",
      }).format(data.date);

      const formattedSlots = data.slots.map((s) => {
        const timeLabel = new Intl.DateTimeFormat("en-US", {
          timeZone: guestTimeZone,
          hour: "numeric",
          minute: "2-digit",
        }).format(new Date(s.start));
        return { start: s.start, label: timeLabel };
      });

      return { date: dateStr, label, month, slots: formattedSlots };
    })
    .sort((a, b) => a.date.localeCompare(b.date));
}

export type Period = "morning" | "afternoon" | "evening";

export type PeriodGroup = {
  period: Period;
  label: string;
  slots: { start: string; label: string }[];
};

const PERIOD_LABELS: Record<Period, string> = {
  morning: "Morning",
  afternoon: "Afternoon",
  evening: "Evening",
};

function getHourInTz(isoString: string, timeZone: string): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hour: "2-digit",
    hourCycle: "h23",
  }).formatToParts(new Date(isoString));
  return parseInt(parts.find(p => p.type === "hour")?.value || "0", 10);
}

export function groupByPeriod(
  slots: { start: string; label: string }[],
  guestTimeZone: string
): PeriodGroup[] {
  const groups: Record<Period, { start: string; label: string }[]> = {
    morning: [],
    afternoon: [],
    evening: [],
  };

  for (const slot of slots) {
    const hour = getHourInTz(slot.start, guestTimeZone);
    if (hour < 12) groups.morning.push(slot);
    else if (hour < 17) groups.afternoon.push(slot);
    else groups.evening.push(slot);
  }

  const periods: Period[] = ["morning", "afternoon", "evening"];
  return periods
    .filter(p => groups[p].length > 0)
    .map(p => ({ period: p, label: PERIOD_LABELS[p], slots: groups[p] }));
}