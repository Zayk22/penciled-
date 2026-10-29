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
  } catch (error: any) {
    // Check for Postgres unique violation (23505)
    const code = error.code || error.cause?.code;
    if (code === "23505") {
      // We can't know exactly which field caused it without parsing the detail, 
      // but 99% of the time it's the username.
      return {
        fieldErrors: {
          username: ["This username is already taken."],
        },
      };
    }
    // Never return raw database errors to the client
    return { error: "An unexpected error occurred. Please try again." };
  }

  redirect("/dashboard");
}