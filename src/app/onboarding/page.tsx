// src/app/onboarding/page.tsx
"use client";

import { useState, useMemo, useLayoutEffect, useRef } from "react";
import { createHostProfile } from "./actions";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Logo } from "@/components/Logo";

export default function OnboardingPage() {
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [isPending, setIsPending] = useState(false);
  
  const selectRef = useRef<HTMLSelectElement>(null);

  // 1. Calculate list synchronously to avoid state updates in effects
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

  // 2. Use useLayoutEffect to safely set the DOM node's value without setState
  useLayoutEffect(() => {
    if (selectRef.current && typeof window !== "undefined") {
      const detected = Intl.DateTimeFormat().resolvedOptions().timeZone;
      if (timezones.includes(detected)) {
        selectRef.current.value = detected;
      }
    }
  }, [timezones]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsPending(true);
    setError(null);
    setFieldErrors({});

    const formData = new FormData(e.currentTarget);
    const result = await createHostProfile(formData);

    if (result?.error) {
      setError(result.error);
    } else if (result?.fieldErrors) {
      setFieldErrors(result.fieldErrors);
    }
    
    setIsPending(false);
  };

  return (
    <div className="min-h-screen bg-paper flex flex-col items-center justify-center p-4">
      <div className="mb-8">
        <Logo variant="full" />
      </div>
      
      <div className="w-full max-w-md bg-surface p-8 rounded-lg border border-border">
        <h1 className="font-serif text-2xl mb-2">Set up your profile</h1>
        <p className="text-muted text-sm mb-6">Choose your public URL and time zone.</p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <Input
              label="Username"
              name="username"
              placeholder="e.g. jane-doe"
              required
              error={fieldErrors.username?.[0]}
            />
            <p className="text-xs text-muted mt-1">Lowercase letters, numbers, and hyphens only.</p>
          </div>

          <Input
            label="Display name"
            name="displayName"
            placeholder="e.g. Jane Doe"
            required
            error={fieldErrors.displayName?.[0]}
          />

          <div className="flex flex-col gap-1.5">
            <label htmlFor="timezone" className="text-sm font-medium text-ink">
              Time zone
            </label>
            <select
              ref={selectRef}
              id="timezone"
              name="timezone"
              className="flex min-h-[44px] w-full rounded-md border border-border bg-surface px-3 py-2 text-base text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest"
              required
              defaultValue="UTC"
            >
              {timezones.map(tz => (
                <option key={tz} value={tz}>{tz.replace(/_/g, " ")}</option>
              ))}
            </select>
            {fieldErrors.timezone && <span className="text-sm text-error">{fieldErrors.timezone[0]}</span>}
          </div>

          {error && <div className="text-sm text-error bg-error/10 p-3 rounded-md">{error}</div>}

          <Button type="submit" className="mt-4" loading={isPending}>
            Complete setup
          </Button>
        </form>
      </div>
    </div>
  );
}