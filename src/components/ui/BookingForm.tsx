// src/components/ui/BookingForm.tsx
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { TurnstileWidget } from "./TurnstileWidget";
import { IconChevronLeft } from "@/components/icons";
import { bookingRequestSchema } from "@/lib/schemas";

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
};

// Stub — replaced in 4D with the real server action. No DB call.
async function submitBookingStub(): Promise<{ ok: boolean; error?: string }> {
  return { ok: false, error: "Booking is not enabled yet." };
}

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
}: BookingFormProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [notes, setNotes] = useState("");
  const [token, setToken] = useState<string | null>(null);
  const [turnstileError, setTurnstileError] = useState(false);
  const [errors, setErrors] = useState<{ name?: string; email?: string }>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    const parsed = bookingRequestSchema.safeParse({
      hostUsername,
      eventSlug,
      requestedStartTime: selectedSlotIso,
      guestName: name,
      guestEmail: email,
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
    const result = await submitBookingStub();
    setIsSubmitting(false);

    if (!result.ok) {
      setSubmitError(result.error || "Something went wrong.");
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
          Back
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
          <div role="alert" className="p-3 bg-error/10 text-error text-sm rounded-md mb-4">
            {submitError}
          </div>
        )}

        <div className="flex flex-col gap-4">
          <Input
            label="Name"
            name="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoComplete="name"
            required
            error={errors.name}
          />

          <Input
            label="Email"
            name="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
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
              className="flex min-h-[100px] w-full rounded-md border border-border bg-surface px-3 py-2 text-base text-ink placeholder:text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest"
            />
          </div>

          <div>
            <TurnstileWidget
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