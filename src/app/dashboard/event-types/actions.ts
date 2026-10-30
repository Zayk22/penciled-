// src/app/dashboard/event-types/actions.ts
"use server";

import { auth } from "@clerk/nextjs/server";
import { db } from "@/db";
import { hosts, eventTypes } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { eventTypeSchema } from "@/lib/schemas";

export type EventTypeActionState = {
  error?: string;
  fieldErrors?: Record<string, string[]>;
  values?: Record<string, string | null | undefined>;
  success?: boolean;
};

export async function createEventType(
  prevState: EventTypeActionState,
  formData: FormData
): Promise<EventTypeActionState> {
  const { userId } = await auth();
  if (!userId) return { error: "Unauthorized" };

  const hostResult = await db.select().from(hosts).where(eq(hosts.clerkUserId, userId)).limit(1);
  const host = hostResult[0];
  if (!host) return { error: "Host not found" };

  const rawValues = {
    title: String(formData.get("title") || ""),
    slug: String(formData.get("slug") || ""),
    description: formData.get("description") ? String(formData.get("description")) : null,
    durationMinutes: String(formData.get("durationMinutes") || ""),
    slotIntervalMinutes: String(formData.get("slotIntervalMinutes") || ""),
    bufferBeforeMinutes: String(formData.get("bufferBeforeMinutes") || ""),
    bufferAfterMinutes: String(formData.get("bufferAfterMinutes") || ""),
    minNoticeMinutes: String(formData.get("minNoticeMinutes") || ""),
    maxDaysAhead: String(formData.get("maxDaysAhead") || ""),
    isActive: formData.get("isActive") ? "true" : null,
  };

  const parsed = eventTypeSchema.safeParse(rawValues);

  if (!parsed.success) {
    return {
      fieldErrors: parsed.error.flatten().fieldErrors,
      values: rawValues,
    };
  }

  try {
    await db.insert(eventTypes).values({
      hostId: host.id,
      ...parsed.data,
    });
  } catch (error: unknown) {
    const err = error as { code?: string; cause?: { code?: string } };
    const code = err.code || err.cause?.code;
    if (code === "23505") {
      return {
        fieldErrors: { slug: ["You already have an event type with that slug."] },
        values: rawValues,
      };
    }
    return { error: "A database error occurred. Please try again.", values: rawValues };
  }

  revalidatePath("/dashboard/event-types");
  revalidatePath("/dashboard");
  return { success: true };
}

export async function updateEventType(
  id: string,
  prevState: EventTypeActionState,
  formData: FormData
): Promise<EventTypeActionState> {
  const { userId } = await auth();
  if (!userId) return { error: "Unauthorized" };

  const hostResult = await db.select().from(hosts).where(eq(hosts.clerkUserId, userId)).limit(1);
  const host = hostResult[0];
  if (!host) return { error: "Host not found" };

  const rawValues = {
    title: String(formData.get("title") || ""),
    slug: String(formData.get("slug") || ""),
    description: formData.get("description") ? String(formData.get("description")) : null,
    durationMinutes: String(formData.get("durationMinutes") || ""),
    slotIntervalMinutes: String(formData.get("slotIntervalMinutes") || ""),
    bufferBeforeMinutes: String(formData.get("bufferBeforeMinutes") || ""),
    bufferAfterMinutes: String(formData.get("bufferAfterMinutes") || ""),
    minNoticeMinutes: String(formData.get("minNoticeMinutes") || ""),
    maxDaysAhead: String(formData.get("maxDaysAhead") || ""),
    isActive: formData.get("isActive") ? "true" : null,
  };

  const parsed = eventTypeSchema.safeParse(rawValues);

  if (!parsed.success) {
    return {
      fieldErrors: parsed.error.flatten().fieldErrors,
      values: rawValues,
    };
  }

  try {
    await db.update(eventTypes)
      .set(parsed.data)
      .where(and(eq(eventTypes.id, id), eq(eventTypes.hostId, host.id)));
  } catch (error: unknown) {
    const err = error as { code?: string; cause?: { code?: string } };
    const code = err.code || err.cause?.code;
    if (code === "23505") {
      return {
        fieldErrors: { slug: ["You already have an event type with that slug."] },
        values: rawValues,
      };
    }
    return { error: "A database error occurred. Please try again.", values: rawValues };
  }

  revalidatePath("/dashboard/event-types");
  revalidatePath("/dashboard");
  return { success: true };
}

export async function toggleEventTypeActive(id: string, isActive: boolean) {
  const { userId } = await auth();
  if (!userId) return { error: "Unauthorized" };

  const hostResult = await db.select().from(hosts).where(eq(hosts.clerkUserId, userId)).limit(1);
  const host = hostResult[0];
  if (!host) return { error: "Host not found" };

  await db.update(eventTypes)
    .set({ isActive })
    .where(and(eq(eventTypes.id, id), eq(eventTypes.hostId, host.id)));

  revalidatePath("/dashboard/event-types");
  revalidatePath("/dashboard");
}