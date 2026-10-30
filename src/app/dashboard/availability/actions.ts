// src/app/dashboard/availability/actions.ts
"use server";

import { auth } from "@clerk/nextjs/server";
import { db } from "@/db";
import { hosts, availabilityRules } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { availabilityRuleSchema } from "@/lib/schemas";

export type AvailabilityActionState = {
  error?: string;
  fieldErrors?: Record<string, string[]>;
  values?: { weekday: string; startTime: string; endTime: string };
  success?: boolean;
};

export async function addAvailabilityRule(
  prevState: AvailabilityActionState,
  formData: FormData
): Promise<AvailabilityActionState> {
  const { userId } = await auth();
  if (!userId) return { error: "Unauthorized" };
  
  const host = await db.query.hosts.findFirst({ where: eq(hosts.clerkUserId, userId) });
  if (!host) return { error: "Host not found" };

  const rawValues = {
    weekday: String(formData.get("weekday") || ""),
    startTime: String(formData.get("startTime") || ""),
    endTime: String(formData.get("endTime") || ""),
  };

  const parsed = availabilityRuleSchema.safeParse(rawValues);

  if (!parsed.success) {
    return {
      fieldErrors: parsed.error.flatten().fieldErrors,
      values: rawValues,
    };
  }

  const startTime = parsed.data.startTime.substring(0, 5);
  const endTime = parsed.data.endTime.substring(0, 5);

  try {
    const existingRules = await db.select().from(availabilityRules).where(eq(availabilityRules.hostId, host.id));
    const timeToMins = (t: string) => { const [h, m] = t.substring(0, 5).split(":").map(Number); return h * 60 + m; };
    
    const newStart = timeToMins(startTime);
    const newEnd = timeToMins(endTime);
    
    const sameDayRules = existingRules.filter(r => r.weekday === parsed.data.weekday);
    for (const rule of sameDayRules) {
      const exStart = timeToMins(rule.startTime);
      const exEnd = timeToMins(rule.endTime);
      if (newStart < exEnd && exStart < newEnd) {
        return {
          fieldErrors: { startTime: ["This time range overlaps with an existing rule."] },
          values: rawValues,
        };
      }
    }

    await db.insert(availabilityRules).values({
      hostId: host.id,
      weekday: parsed.data.weekday,
      startTime,
      endTime,
    });
  } catch {
    return { error: "A database error occurred. Please try again.", values: rawValues };
  }
  
  revalidatePath("/dashboard/availability");
  return { success: true };
}

export type DeleteResult = { success?: boolean; error?: string };

export async function deleteAvailabilityRule(id: string): Promise<DeleteResult> {
  const { userId } = await auth();
  if (!userId) return { error: "Unauthorized" };
  
  const host = await db.query.hosts.findFirst({ where: eq(hosts.clerkUserId, userId) });
  if (!host) return { error: "Host not found" };

  try {
    await db.delete(availabilityRules).where(
      and(eq(availabilityRules.id, id), eq(availabilityRules.hostId, host.id))
    );
    revalidatePath("/dashboard/availability");
    return { success: true };
  } catch {
    return { error: "Could not delete rule." };
  }
}