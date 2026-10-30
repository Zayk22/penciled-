"use server";

import { auth } from "@clerk/nextjs/server";
import { db } from "@/db";
import { hosts, dateOverrides } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { dateOverrideSchema } from "@/lib/schemas";
import { getTodayInTimezone } from "@/lib/time";

export type OverrideActionState = {
  error?: string;
  fieldErrors?: Record<string, string[]>;
  values?: { date: string; isBlocked: string; startTime: string; endTime: string };
  success?: boolean;
};

export async function addOverride(
  prevState: OverrideActionState,
  formData: FormData
): Promise<OverrideActionState> {
  const { userId } = await auth();
  if (!userId) return { error: "Unauthorized" };
  
  const hostResult = await db.select().from(hosts).where(eq(hosts.clerkUserId, userId)).limit(1);
  const host = hostResult[0];
  if (!host) return { error: "Host not found" };

  const isBlocked = formData.get("isBlocked") === "true";
  const rawValues = {
    date: String(formData.get("date") || ""),
    isBlocked: String(isBlocked),
    startTime: isBlocked ? "" : String(formData.get("startTime") || ""),
    endTime: isBlocked ? "" : String(formData.get("endTime") || ""),
  };

  const parsed = dateOverrideSchema.safeParse({
    date: rawValues.date,
    isBlocked,
    startTime: rawValues.startTime || null,
    endTime: rawValues.endTime || null,
  });

  if (!parsed.success) {
    return {
      fieldErrors: parsed.error.flatten().fieldErrors,
      values: rawValues,
    };
  }

  const todayHostTz = getTodayInTimezone(host.timezone);
  if (parsed.data.date < todayHostTz) {
    return {
      fieldErrors: { date: ["Cannot create an override for a past date."] },
      values: rawValues,
    };
  }

  try {
    await db.insert(dateOverrides).values({
      hostId: host.id,
      date: parsed.data.date,
      isBlocked: parsed.data.isBlocked,
      startTime: parsed.data.isBlocked ? null : parsed.data.startTime,
      endTime: parsed.data.isBlocked ? null : parsed.data.endTime,
    });
  } catch (error: unknown) {
    const err = error as { code?: string; cause?: { code?: string } };
    const code = err.code || err.cause?.code;
    if (code === "23505") {
      return {
        fieldErrors: { date: ["You already have an override for that date."] },
        values: rawValues,
      };
    }
    return { error: "A database error occurred. Please try again.", values: rawValues };
  }
  
  revalidatePath("/dashboard/availability/overrides");
  return { success: true };
}

export type DeleteResult = { success?: boolean; error?: string };

export async function deleteOverride(id: string): Promise<DeleteResult> {
  const { userId } = await auth();
  if (!userId) return { error: "Unauthorized" };
  
  const hostResult = await db.select().from(hosts).where(eq(hosts.clerkUserId, userId)).limit(1);
  const host = hostResult[0];
  if (!host) return { error: "Host not found" };

  try {
    await db.delete(dateOverrides).where(
      and(eq(dateOverrides.id, id), eq(dateOverrides.hostId, host.id))
    );
    revalidatePath("/dashboard/availability/overrides");
    return { success: true };
  } catch {
    return { error: "Could not delete override." };
  }
}