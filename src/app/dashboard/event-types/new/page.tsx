// src/app/dashboard/event-types/new/page.tsx
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { hosts } from "@/db/schema";
import { eq } from "drizzle-orm";
import { EventTypeForm } from "@/components/ui/EventTypeForm";
import Link from "next/link";
import { IconChevronLeft } from "@/components/icons";

export default async function NewEventTypePage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const hostResult = await db.select().from(hosts).where(eq(hosts.clerkUserId, userId)).limit(1);
  const host = hostResult[0];
  if (!host) redirect("/onboarding");

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
        <h1 className="font-serif text-3xl mb-2">New event type</h1>
        <p className="text-muted text-sm">Set up the details for this meeting.</p>
      </div>

      <div className="bg-surface border border-border rounded-md p-6 md:p-8">
        <EventTypeForm mode="create" hostUsername={host.username} />
      </div>
    </div>
  );
}