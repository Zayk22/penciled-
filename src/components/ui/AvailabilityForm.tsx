"use client";

import { useActionState } from "react";
import { addAvailabilityRule, AvailabilityActionState } from "@/app/dashboard/availability/actions";
import { Button } from "@/components/ui/Button";

const timeOptions = Array.from({ length: 24 * 4 }).map((_, i) => {
  const h = Math.floor(i / 4);
  const m = (i % 4) * 15;
  return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`;
});

const weekdays = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

const initialState: AvailabilityActionState = {
  values: { weekday: "1", startTime: "09:00", endTime: "17:00" }
};

export function AvailabilityForm() {
  const [state, formAction, isPending] = useActionState(addAvailabilityRule, initialState);
  
  return (
    <form action={formAction} className="flex flex-col gap-4 border border-border bg-surface p-6 rounded-md">
      {state?.error && (
        <div role="alert" className="p-3 bg-error/10 text-error text-sm rounded-md">
          {state.error}
        </div>
      )}
      
      <div className="flex flex-col gap-1.5">
        <label htmlFor="weekday" className="text-sm font-medium">Day of week</label>
        <select 
          name="weekday" 
          id="weekday" 
          defaultValue={state?.values?.weekday || "1"} 
          className="flex min-h-[44px] w-full rounded-md border border-border bg-surface px-3 py-2 text-base text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest" 
          required
        >
          {weekdays.map((day, i) => (
            <option key={i} value={i}>{day}</option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="startTime" className="text-sm font-medium">Start time</label>
          <select 
            name="startTime" 
            id="startTime" 
            defaultValue={state?.values?.startTime || "09:00"} 
            className="flex min-h-[44px] w-full rounded-md border border-border bg-surface px-3 py-2 text-base text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest" 
            required
          >
            {timeOptions.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
          {state?.fieldErrors?.startTime && (
            <span role="alert" className="text-xs text-error">{state.fieldErrors.startTime[0]}</span>
          )}
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="endTime" className="text-sm font-medium">End time</label>
          <select 
            name="endTime" 
            id="endTime" 
            defaultValue={state?.values?.endTime || "17:00"} 
            className="flex min-h-[44px] w-full rounded-md border border-border bg-surface px-3 py-2 text-base text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest" 
            required
          >
            {timeOptions.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
          {state?.fieldErrors?.endTime && (
            <span role="alert" className="text-xs text-error">{state.fieldErrors.endTime[0]}</span>
          )}
        </div>
      </div>

      <Button type="submit" loading={isPending} className="mt-2">
        Add availability
      </Button>
    </form>
  );
}