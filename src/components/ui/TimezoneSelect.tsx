// src/components/ui/TimezoneSelect.tsx
"use client";

import { useMemo, useLayoutEffect, useRef } from "react";

export function TimezoneSelect({ 
  name = "timezone", 
  defaultValue, 
  isOnboarding = false,
  onChange,
}: { 
  name?: string; 
  defaultValue?: string; 
  isOnboarding?: boolean;
  onChange?: (tz: string) => void;
}) {
  const selectRef = useRef<HTMLSelectElement>(null);
  
  const timezones = useMemo(() => {
    let supported: string[] = [];
    try {
      supported = Intl.supportedValuesOf("timeZone");
    } catch {
      supported = ["America/New_York", "Europe/London", "UTC"];
    }
    if (!supported.includes("UTC")) supported.push("UTC");
    return supported;
  }, []);

  useLayoutEffect(() => {
    if (isOnboarding && selectRef.current && typeof window !== "undefined") {
      const detected = Intl.DateTimeFormat().resolvedOptions().timeZone;
      if (timezones.includes(detected)) {
        selectRef.current.value = detected;
      }
    }
  }, [timezones, isOnboarding]);

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={name} className="text-sm font-medium text-ink">Time zone</label>
      <select
        ref={selectRef}
        id={name}
        name={name}
        onChange={(e) => onChange?.(e.target.value)}
        className="flex min-h-[44px] w-full rounded-md border border-border bg-surface px-3 py-2 text-base text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest"
        required
        defaultValue={defaultValue || "UTC"}
      >
        {timezones.map(tz => (
          <option key={tz} value={tz}>{tz.replace(/_/g, " ")}</option>
        ))}
      </select>
    </div>
  );
}