// src/components/ui/RescheduleForm.tsx
"use client";

import { useActionState } from "react";
import { rescheduleBooking, RescheduleState } from "@/app/booking/[token]/reschedule/actions";
import { Button } from "@/components/ui/Button";
import Link from "next/link";

export function RescheduleForm({
  token,
  slots,
}: {
  token: string;
  slots: { start: string; label: string }[];
}) {
  const [state, formAction, isPending] = useActionState(rescheduleBooking, {});

  return (
    <form action={formAction} className="flex flex-col gap-4">
      {state?.error && (
        <div role="alert" className="p-3 bg-error/10 text-error text-sm rounded-md">
          {state.error}
        </div>
      )}
      
      <input type="hidden" name="token" value={token} />
      
      <div className="flex flex-col gap-1.5">
        <label htmlFor="requestedStartTime" className="text-sm font-medium">New time</label>
        <select 
          name="requestedStartTime" 
          id="requestedStartTime" 
          className="flex min-h-[44px] w-full rounded-md border border-border bg-surface px-3 py-2 text-base text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest disabled:opacity-50"
          required
          disabled={isPending}
        >
          {slots.map(slot => (
            <option key={slot.start} value={slot.start}>
              {slot.label}
            </option>
          ))}
        </select>
      </div>

      <Button type="submit" className="mt-4 w-full" loading={isPending}>
        Confirm new time
      </Button>
      
      <Link 
        href={`/booking/${token}`} 
        className="text-sm font-medium text-muted hover:text-ink text-center min-h-[44px] flex items-center justify-center transition-colors"
      >
        Back to booking
      </Link>
    </form>
  );
}