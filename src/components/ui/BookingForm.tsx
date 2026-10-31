// src/components/ui/BookingForm.tsx
"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { TurnstileWidget } from "./TurnstileWidget";
import { IconChevronLeft } from "@/components/icons";
import { bookingRequestSchema } from "@/lib/schemas";
import { createBooking } from "@/app/[username]/[eventSlug]/actions";

type BookingFormProps = {
  hostUsername: string;
  eventSlug: string;
  eventTitle: string;
  durationMinutes: number;
  selectedSlotIso: string;
  dayLabel: string;
  timeLabel: string;
  guestTz: string;
  onBack: () => void;
  guestName: string;
  setGuestName: (v: string) => void;
  guestEmail: string;
  setGuestEmail: (v: string) => void;
  notes: string;
  setNotes: (v: string) => void;
  onSlotTaken: () => void;
};

export function BookingForm({
  hostUsername,
  eventSlug,
  eventTitle,
  durationMinutes,
  selectedSlotIso,
  dayLabel,
  timeLabel,
  guestTz,
  onBack,
  guestName,
  setGuestName,
  guestEmail,
  setGuestEmail,
  notes,
  setNotes,
  onSlotTaken,
}: BookingFormProps) {
  const [token, setToken] = useState<string | null>(null);
  const [turnstileError, setTurnstileError] = useState(false);
  const [turnstileKey, setTurnstileKey] = useState(0); // Used to force reset
  const [errors, setErrors] = useState<{ name?: string; email?: string }>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const errorRef = useRef<HTMLDivElement>(null);

  // Focus the error banner when it appears
  useEffect(() => {
    if (submitError) {
      errorRef.current?.focus();
    }
  }, [submitError]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    const parsed = bookingRequestSchema.safeParse({
      hostUsername,
      eventSlug,
      requestedStartTime: selectedSlotIso,
      guestName,
      guestEmail,
      guestTimezone: guestTz,
      notes: notes.trim() ? notes : null,
    });

    if (!parsed.success) {
      const fieldErrors = parsed.error.flatten().fieldErrors;
      setErrors({
        name: fieldErrors.guestName?.[0],
        email: fieldErrors.guestEmail?.[0],
      });
      return;
    }

    if (!token) {
      setSubmitError("Please complete the verification.");
      return;
    }

    setErrors({});
    setIsSubmitting(true);
    
    const result = await createBooking({
      hostUsername,
      eventSlug,
      requestedStartTime: selectedSlotIso,
      guestName,
      guestEmail,
      guestTimezone: guestTz,
      notes: notes.trim() ? notes : null,
      turnstileToken: token,
    });

    setIsSubmitting(false);

    if (!result.ok) {
      if (result.code === "slot_taken") {
        onSlotTaken();
        setToken(null);
        setTurnstileKey(k => k + 1);
      } else {
        setSubmitError(result.error || "Something went wrong.");
        setToken(null);
        setTurnstileKey(k => k + 1);
      }
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col h-full">
      <div className="flex-1 min-h-0 md:overflow-y-auto p-4 md:p-6 pb-28 md:pb-6">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center min-h-[44px] text-sm text-muted hover:text-ink transition-colors mb-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest focus-visible:ring-offset-2 focus-visible:ring-offset-surface rounded"
        >
          <IconChevronLeft width={16} height={16} className="mr-1" />
          Back to times
        </button>

        <div className="bg-paper border border-border rounded-md p-4 mb-6">
          <p className="text-xs text-muted mb-1">You are booking</p>
          <p className="font-medium text-ink">{eventTitle}</p>
          <p className="text-sm text-ink mt-1">
            {dayLabel} at {timeLabel}
          </p>
          <p className="text-xs text-muted mt-1">
            {durationMinutes} minutes · {guestTz.replace(/_/g, " ")}
          </p>
        </div>

        {submitError && (
          <div 
            ref={errorRef}
            tabIndex={-1}
            role="alert" 
            className="p-3 bg-error/10 text-error text-sm rounded-md mb-4 outline-none"
          >
            {submitError}
          </div>
        )}

        <div className="flex flex-col gap-4">
          <Input
            label="Name"
            name="name"
            value={guestName}
            onChange={(e) => setGuestName(e.target.value)}
            autoComplete="name"
            required
            error={errors.name}
          />

          <Input
            label="Email"
            name="email"
            type="email"
            value={guestEmail}
            onChange={(e) => setGuestEmail(e.target.value)}
            autoComplete="email"
            required
            error={errors.email}
          />

          <div className="flex flex-col gap-1.5">
            <label htmlFor="notes" className="text-sm font-medium text-ink">
              Notes (optional)
            </label>
            <textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              maxLength={500}
              rows={3}
              className="flex w-full rounded-md border border-border bg-surface px-3 py-2 text-base text-ink placeholder:text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest"
            />
          </div>

          <div>
            <TurnstileWidget
              key={turnstileKey}
              onSuccess={(t) => {
                setToken(t);
                setTurnstileError(false);
              }}
              onError={() => {
                setToken(null);
                setTurnstileError(true);
              }}
              onExpire={() => setToken(null)}
            />
            {turnstileError && (
              <p role="alert" className="text-xs text-error mt-2">
                Verification failed to load. Refresh the page.
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="fixed md:static bottom-0 left-0 right-0 md:left-auto md:right-auto z-20 bg-surface md:bg-transparent border-t md:border-t-0 border-border px-4 py-3 md:p-6 pb-[calc(0.75rem+env(safe-area-inset-bottom))] md:pb-6 shrink-0">
        <div className="max-w-5xl mx-auto flex items-center justify-between gap-4">
          <p className="text-sm text-muted">
            {token ? "Ready to confirm" : "Complete verification to confirm"}
          </p>
          <Button type="submit" loading={isSubmitting} disabled={!token}>
            Confirm booking
          </Button>
        </div>
      </div>
    </form>
  );
}