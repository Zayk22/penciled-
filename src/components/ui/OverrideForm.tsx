"use client";

import { useActionState, useState } from "react";
import { addOverride, OverrideActionState } from "@/app/dashboard/availability/overrides/actions";
import { Button } from "@/components/ui/Button";

const timeOptions = Array.from({ length: 24 * 4 }).map((_, i) => {
  const h = Math.floor(i / 4);
  const m = (i % 4) * 15;
  return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`;
});

const initialState: OverrideActionState = {
  values: { date: "", isBlocked: "true", startTime: "09:00", endTime: "17:00" }
};

export function OverrideForm({ minDate }: { minDate: string }) {
  const [state, formAction, isPending] = useActionState(addOverride, initialState);
  
  // Initialize from returned values. If undefined, default to true (blocked).
  const [isBlocked, setIsBlocked] = useState(state?.values?.isBlocked !== "false");
  
  return (
    <form action={formAction} className="flex flex-col gap-4 border border-border bg-surface p-6 rounded-md">
      {state?.error && (
        <div role="alert" className="p-3 bg-error/10 text-error text-sm rounded-md">{state.error}</div>
      )}
      {state?.success && (
        <div role="status" className="p-3 bg-forest/10 text-forest text-sm rounded-md">
          Override saved successfully.
        </div>
      )}
      
      <div className="flex flex-col gap-1.5">
        <label htmlFor="date" className="text-sm font-medium">Date</label>
        <input 
          type="date"
          name="date" 
          id="date" 
          min={minDate}
          defaultValue={state?.values?.date} 
          className="flex min-h-[44px] w-full rounded-md border border-border bg-surface px-3 py-2 text-base text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest" 
          required
        />
        {state?.fieldErrors?.date && (
          <span role="alert" className="text-xs text-error">{state.fieldErrors.date[0]}</span>
        )}
      </div>

      <label className="flex items-center gap-3 min-h-[44px] cursor-pointer">
        <input 
          type="checkbox" 
          id="isBlocked" 
          name="isBlocked" 
          value="true"
          checked={isBlocked}
          onChange={(e) => setIsBlocked(e.target.checked)}
          className="w-5 h-5 rounded border-border text-forest focus:ring-forest accent-[#1E5B43]"
        />
        <span className="text-sm font-medium select-none">Block entire day</span>
      </label>

      {!isBlocked && (
        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="startTime" className="text-sm font-medium">Start time</label>
            <select 
              name="startTime" 
              id="startTime" 
              defaultValue={state?.values?.startTime || "09:00"} 
              className="flex min-h-[44px] w-full rounded-md border border-border bg-surface px-3 py-2 text-base text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest" 
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
            >
              {timeOptions.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
            {state?.fieldErrors?.endTime && (
              <span role="alert" className="text-xs text-error">{state.fieldErrors.endTime[0]}</span>
            )}
          </div>
        </div>
      )}

      <Button type="submit" loading={isPending} className="mt-2">
        Save override
      </Button>
    </form>
  );
}