// src/app/onboarding/actions.ts
"use server";

import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { hosts } from "@/db/schema";
import { onboardingSchema } from "@/lib/schemas";

export type OnboardingResult = {
  error?: string;
  fieldErrors?: Record<string, string[]>;
};

export async function createHostProfile(
  formData: FormData
): Promise<OnboardingResult> {
  const { userId } = await auth();
  if (!userId) {
    return { error: "Unauthorized" };
  }

  const rawData = {
    username: formData.get("username"),
    displayName: formData.get("displayName"),
    timezone: formData.get("timezone"),
  };

  const parsed = onboardingSchema.safeParse(rawData);

  if (!parsed.success) {
    return {
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  try {
    await db.insert(hosts).values({
      clerkUserId: userId,
      username: parsed.data.username,
      displayName: parsed.data.displayName,
      timezone: parsed.data.timezone,
    });
  } catch (error: unknown) {
    const err = error as { code?: string; cause?: { code?: string } };
    const code = err.code || err.cause?.code;
    
    if (code === "23505") {
      return {
        fieldErrors: {
          username: ["This username is already taken."],
        },
      };
    }
    return { error: "An unexpected error occurred. Please try again." };
  }

  redirect("/dashboard");
}