// src/app/dashboard/event-types/[id]/edit/page.tsx
import { auth } from "@clerk/nextjs/server";
import { redirect, notFound } from "next/navigation";
import { db } from "@/db";
import { hosts, eventTypes } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { EventTypeForm } from "@/components/ui/EventTypeForm";
import Link from "next/link";
import { IconChevronLeft } from "@/components/icons";
import { z } from "zod";

export default async function EditEventTypePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  
  // 1. Validate ID format before hitting the DB
  const parsedId = z.string().uuid().safeParse(id);
  if (!parsedId.success) notFound();

  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  // 2. Fetch host
  const hostResult = await db.select().from(hosts).where(eq(hosts.clerkUserId, userId)).limit(1);
  const host = hostResult[0];
  if (!host) redirect("/onboarding");

  // 3. Fetch event type scoped to host
  const typeResult = await db.select().from(eventTypes).where(
    and(eq(eventTypes.id, parsedId.data), eq(eventTypes.hostId, host.id))
  ).limit(1);
  
  const eventType = typeResult[0];
  if (!eventType) notFound();

  return (
    <div className="flex flex-col gap-8 max-w-3xl mx-auto w-full">
      <div>
        <div className="flex items-center gap-2 mb-4 text-sm text-muted">
          <Link 
            href="/dashboard/event-types" 
            className="flex items-center min-h-[44px] md:min-h-0 hover:text-ink transition-colors"
          >
            <IconChevronLeft width={16} height={16} className="mr-1" />
            Event types
          </Link>
        </div>
        <h1 className="font-serif text-3xl mb-2">Edit event type</h1>
        <p className="text-muted text-sm">Update the details for this meeting.</p>
      </div>

      <div className="bg-surface border border-border rounded-md p-6 md:p-8">
        <EventTypeForm mode="edit" initialData={eventType} hostUsername={host.username} />
      </div>
    </div>
  );
}