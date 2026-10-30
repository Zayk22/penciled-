// src/app/dashboard/settings/actions.ts
"use server";

import { auth } from "@clerk/nextjs/server";
import { db } from "@/db";
import { hosts } from "@/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { isValidTimezone } from "@/lib/time";

const settingsSchema = z.object({
  displayName: z.string().min(1, "Display name is required").max(50),
  timezone: z.string().refine(isValidTimezone, "Invalid timezone"),
});

export type SettingsActionState = {
  error?: string;
  fieldErrors?: Record<string, string[]>;
  success?: boolean;
};

export async function updateSettings(prevState: SettingsActionState, formData: FormData): Promise<SettingsActionState> {
  const { userId } = await auth();
  if (!userId) return { error: "Unauthorized" };

  const hostResult = await db.select().from(hosts).where(eq(hosts.clerkUserId, userId)).limit(1);
  const host = hostResult[0];
  if (!host) return { error: "Host not found" };

  const parsed = settingsSchema.safeParse({
    displayName: formData.get("displayName"),
    timezone: formData.get("timezone"),
  });

  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  try {
    await db.update(hosts).set(parsed.data).where(eq(hosts.id, host.id));
    revalidatePath("/dashboard/settings");
    revalidatePath("/dashboard");
    return { success: true };
  } catch {
    return { error: "Failed to update settings." };
  }
}