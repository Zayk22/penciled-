// src/app/onboarding/page.tsx
"use client";

import { useState } from "react";
import { createHostProfile } from "./actions";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Logo } from "@/components/Logo";
import { TimezoneSelect } from "@/components/ui/TimezoneSelect";

export default function OnboardingPage() {
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [isPending, setIsPending] = useState(false);

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

          <div>
            <TimezoneSelect name="timezone" isOnboarding={true} />
            {fieldErrors.timezone && (
              <span role="alert" className="text-sm text-error mt-1 block">{fieldErrors.timezone[0]}</span>
            )}
          </div>

          {error && <div role="alert" className="text-sm text-error bg-error/10 p-3 rounded-md">{error}</div>}

          <Button type="submit" className="mt-4" loading={isPending}>
            Complete setup
          </Button>
        </form>
      </div>
    </div>
  );
}