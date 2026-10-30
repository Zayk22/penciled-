// src/components/ui/SettingsForm.tsx
"use client";

import { useActionState } from "react";
import { updateSettings } from "@/app/dashboard/settings/actions";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { TimezoneSelect } from "./TimezoneSelect";

export function SettingsForm({ host }: { host: { displayName: string; timezone: string; username: string } }) {
  const [state, formAction, isPending] = useActionState(updateSettings, {});

  return (
    <form action={formAction} className="flex flex-col gap-6 max-w-lg">
      {state?.error && <div role="alert" className="p-3 bg-error/10 text-error text-sm rounded-md">{state.error}</div>}
      {state?.success && <div role="status" className="p-3 bg-forest/10 text-forest text-sm rounded-md">Settings saved successfully.</div>}

      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-ink">Username</label>
        <div className="px-3 py-2 border border-border rounded-md bg-border/20 text-muted font-mono">
          @{host.username}
        </div>
        <p className="text-xs text-muted">Your username cannot be changed.</p>
      </div>

      <Input label="Display name" name="displayName" defaultValue={host.displayName} required error={state?.fieldErrors?.displayName?.[0]} />
      
      <div>
        <TimezoneSelect name="timezone" defaultValue={host.timezone} isOnboarding={false} />
        <p className="text-xs text-muted mt-2">
          Changing your time zone will not rewrite your existing availability or overrides. They will be interpreted in the new zone. Existing bookings are unaffected as they are stored in UTC.
        </p>
      </div>

      <div>
        <Button type="submit" loading={isPending}>Save changes</Button>
      </div>
    </form>
  );
}