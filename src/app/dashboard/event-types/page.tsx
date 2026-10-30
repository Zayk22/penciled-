// src/app/dashboard/event-types/page.tsx
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { hosts, eventTypes } from "@/db/schema";
import { eq } from "drizzle-orm";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { toggleEventTypeActive } from "./actions";
import { EmptyState } from "@/components/ui/States";

export default async function EventTypesPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const hostResult = await db.select().from(hosts).where(eq(hosts.clerkUserId, userId)).limit(1);
  const host = hostResult[0];
  if (!host) redirect("/onboarding");

  const types = await db.select().from(eventTypes).where(eq(eventTypes.hostId, host.id));
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  return (
    <div className="flex flex-col gap-8 max-w-4xl mx-auto w-full">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl mb-2">Event types</h1>
          <p className="text-muted text-sm">Define the types of meetings you want to offer.</p>
        </div>
        <Link href="/dashboard/event-types/new">
          <Button variant="primary">New event type</Button>
        </Link>
      </div>

      {types.length === 0 ? (
        <EmptyState 
          title="No event types" 
          description="Create your first event type so guests know what they can book."
          action={
            <Link href="/dashboard/event-types/new">
              <Button variant="secondary">Create event type</Button>
            </Link>
          }
        />
      ) : (
        <div className="flex flex-col gap-3">
          {types.map((type) => (
            <div key={type.id} className="flex flex-col md:flex-row md:items-center justify-between p-4 border border-border bg-surface rounded-md gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-1">
                  <h2 className="font-medium text-ink text-lg">{type.title}</h2>
                  {type.isActive ? (
                    <span className="text-xs font-medium bg-forest/10 text-forest px-2 py-1 rounded">Active</span>
                  ) : (
                    <span className="text-xs font-medium bg-border text-muted px-2 py-1 rounded">Inactive</span>
                  )}
                </div>
                <p className="text-sm text-muted">{type.durationMinutes} minutes</p>
                <p className="text-xs font-mono text-muted mt-2 break-all">
                  {baseUrl.replace(/\/$/, "")}/{host.username}/{type.slug}
                </p>
              </div>

              <div className="flex items-center gap-4">
                <form action={async () => {
                  "use server";
                  await toggleEventTypeActive(type.id, !type.isActive);
                }}>
                  <button 
                    type="submit" 
                    className="text-sm font-medium text-muted hover:text-ink transition-colors underline underline-offset-4"
                    aria-label={`${type.isActive ? 'Deactivate' : 'Activate'} ${type.title}`}
                  >
                    {type.isActive ? "Deactivate" : "Activate"}
                  </button>
                </form>

                <Link 
                  href={`/dashboard/event-types/${type.id}/edit`}
                  className="text-sm font-medium text-forest hover:underline underline-offset-4"
                >
                  Edit
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}