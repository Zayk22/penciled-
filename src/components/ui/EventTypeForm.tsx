// src/components/ui/EventTypeForm.tsx
"use client";

import { useActionState } from "react";
import Link from "next/link";
import { createEventType, updateEventType, EventTypeActionState } from "@/app/dashboard/event-types/actions";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { DURATIONS, SLOT_INTERVALS, BUFFERS, MIN_NOTICES, MAX_DAYS } from "@/lib/schemas";

interface EventTypeFormProps {
  mode: "create" | "edit";
  initialData?: {
    id: string;
    title: string;
    slug: string;
    description: string | null;
    durationMinutes: number;
    slotIntervalMinutes: number;
    bufferBeforeMinutes: number;
    bufferAfterMinutes: number;
    minNoticeMinutes: number;
    maxDaysAhead: number;
    isActive: boolean;
  };
  hostUsername: string;
}

export function EventTypeForm({ mode, initialData, hostUsername }: EventTypeFormProps) {
  const initialState: EventTypeActionState = {
    values: initialData ? {
      title: initialData.title,
      slug: initialData.slug,
      description: initialData.description,
      durationMinutes: String(initialData.durationMinutes),
      slotIntervalMinutes: String(initialData.slotIntervalMinutes),
      bufferBeforeMinutes: String(initialData.bufferBeforeMinutes),
      bufferAfterMinutes: String(initialData.bufferAfterMinutes),
      minNoticeMinutes: String(initialData.minNoticeMinutes),
      maxDaysAhead: String(initialData.maxDaysAhead),
      isActive: initialData.isActive ? "true" : null,
    } : undefined,
  };

  const action = mode === "edit" && initialData 
    ? updateEventType.bind(null, initialData.id) 
    : createEventType;

  const [state, formAction, isPending] = useActionState(action, initialState);
  
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const previewSlug = state?.values?.slug || initialData?.slug || "your-slug";
  const publicUrl = `${baseUrl.replace(/\/$/, "")}/${hostUsername}/${previewSlug}`;

  return (
    <form action={formAction} className="flex flex-col gap-6">
      {state?.error && (
        <div role="alert" className="p-3 bg-error/10 text-error text-sm rounded-md">{state.error}</div>
      )}
      {state?.success && (
        <div role="status" className="p-3 bg-forest/10 text-forest text-sm rounded-md">
          Event type saved successfully.
        </div>
      )}

      <div className="flex flex-col gap-4">
        <Input
          label="Title"
          name="title"
          placeholder="e.g. 30 Minute Meeting"
          defaultValue={state?.values?.title ?? undefined}
          error={state?.fieldErrors?.title?.[0]}
          required
        />
        
        <div>
          <Input
            label="Slug"
            name="slug"
            placeholder="e.g. 30-min"
            defaultValue={state?.values?.slug ?? undefined}
            error={state?.fieldErrors?.slug?.[0]}
            required
          />
          <div className="flex flex-col gap-1 mt-2">
            <p className="text-xs text-muted">Public URL preview:</p>
            <p className="text-xs font-mono break-all text-ink bg-surface p-2 rounded border border-border">{publicUrl}</p>
            {mode === "edit" && (
              <p className="text-xs text-error mt-1 font-medium">Changing the slug breaks links you have already shared.</p>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="description" className="text-sm font-medium">Description (optional)</label>
          <textarea
            id="description"
            name="description"
            defaultValue={state?.values?.description ?? undefined}
            className="flex min-h-[100px] w-full rounded-md border border-border bg-surface px-3 py-2 text-base text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest"
          />
          {state?.fieldErrors?.description && (
            <span role="alert" className="text-xs text-error">{state.fieldErrors.description[0]}</span>
          )}
        </div>
      </div>

      <div className="h-px bg-border my-2" />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="durationMinutes" className="text-sm font-medium">Duration</label>
          <select name="durationMinutes" id="durationMinutes" defaultValue={state?.values?.durationMinutes || "30"} className="flex min-h-[44px] w-full rounded-md border border-border bg-surface px-3 py-2 text-base text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest">
            {DURATIONS.map(d => <option key={d} value={d}>{d} minutes</option>)}
          </select>
          {state?.fieldErrors?.durationMinutes && <span role="alert" className="text-xs text-error">{state.fieldErrors.durationMinutes[0]}</span>}
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="slotIntervalMinutes" className="text-sm font-medium">Slot interval</label>
          <select name="slotIntervalMinutes" id="slotIntervalMinutes" defaultValue={state?.values?.slotIntervalMinutes || "30"} className="flex min-h-[44px] w-full rounded-md border border-border bg-surface px-3 py-2 text-base text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest">
            {SLOT_INTERVALS.map(d => <option key={d} value={d}>{d} minutes</option>)}
          </select>
          {state?.fieldErrors?.slotIntervalMinutes && <span role="alert" className="text-xs text-error">{state.fieldErrors.slotIntervalMinutes[0]}</span>}
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="bufferBeforeMinutes" className="text-sm font-medium">Buffer before</label>
          <select name="bufferBeforeMinutes" id="bufferBeforeMinutes" defaultValue={state?.values?.bufferBeforeMinutes || "0"} className="flex min-h-[44px] w-full rounded-md border border-border bg-surface px-3 py-2 text-base text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest">
            {BUFFERS.map(d => <option key={d} value={d}>{d} minutes</option>)}
          </select>
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="bufferAfterMinutes" className="text-sm font-medium">Buffer after</label>
          <select name="bufferAfterMinutes" id="bufferAfterMinutes" defaultValue={state?.values?.bufferAfterMinutes || "0"} className="flex min-h-[44px] w-full rounded-md border border-border bg-surface px-3 py-2 text-base text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest">
            {BUFFERS.map(d => <option key={d} value={d}>{d} minutes</option>)}
          </select>
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="minNoticeMinutes" className="text-sm font-medium">Minimum notice</label>
          <select name="minNoticeMinutes" id="minNoticeMinutes" defaultValue={state?.values?.minNoticeMinutes || "240"} className="flex min-h-[44px] w-full rounded-md border border-border bg-surface px-3 py-2 text-base text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest">
            {MIN_NOTICES.map(d => <option key={d} value={d}>{d === 0 ? "None" : d < 60 ? `${d} minutes` : d === 1440 ? "24 hours" : d === 2880 ? "48 hours" : `${d/60} hours`}</option>)}
          </select>
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="maxDaysAhead" className="text-sm font-medium">Bookable window</label>
          <select name="maxDaysAhead" id="maxDaysAhead" defaultValue={state?.values?.maxDaysAhead || "30"} className="flex min-h-[44px] w-full rounded-md border border-border bg-surface px-3 py-2 text-base text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest">
            {MAX_DAYS.map(d => <option key={d} value={d}>{d} days ahead</option>)}
          </select>
        </div>
      </div>

      <div className="h-px bg-border my-2" />

      <label className="flex items-center gap-3 cursor-pointer">
        <input 
          type="checkbox" 
          name="isActive" 
          defaultChecked={mode === "edit" ? initialData?.isActive : true}
          className="w-5 h-5 rounded border-border text-forest focus:ring-forest accent-[#1E5B43]"
        />
        <span className="text-sm font-medium select-none">Active (guests can book this event)</span>
      </label>

      <div className="flex items-center gap-4 mt-4">
        <Button type="submit" loading={isPending}>
          {mode === "edit" ? "Save changes" : "Create event type"}
        </Button>
        <Link href="/dashboard/event-types" className="text-sm font-medium text-muted hover:text-ink">
          Cancel
        </Link>
      </div>
    </form>
  );
}