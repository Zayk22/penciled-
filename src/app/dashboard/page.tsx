// src/app/dashboard/page.tsx
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { hosts, availabilityRules, eventTypes } from "@/db/schema";
import { eq } from "drizzle-orm";
import Link from "next/link";
import { CopyButton } from "@/components/ui/UserMenu";
import { IconCheck, IconArrowRight } from "@/components/icons";

export default async function DashboardPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const hostResult = await db.select().from(hosts).where(eq(hosts.clerkUserId, userId)).limit(1);
  const host = hostResult[0];
  
  if (!host) redirect("/onboarding");

  const rules = await db.select().from(availabilityRules).where(eq(availabilityRules.hostId, host.id));
  const types = await db.select().from(eventTypes).where(eq(eventTypes.hostId, host.id));

  const hasAvailability = rules.length > 0;
  // Fix: Only count active event types
  const hasActiveEventType = types.some(t => t.isActive);
  
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const publicUrl = `${baseUrl.replace(/\/$/, "")}/${host.username}`;

  return (
    <div className="flex flex-col gap-8 max-w-4xl mx-auto w-full">
      <div>
        <h1 className="font-serif text-3xl mb-2">Upcoming bookings</h1>
        <p className="text-muted text-sm">View and manage your scheduled meetings.</p>
      </div>
      
      <div className="border border-border rounded-md bg-surface p-6 md:p-8 flex flex-col gap-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-6">
          <div>
            <h2 className="font-medium text-ink mb-1">Your booking link</h2>
            <p className="text-sm text-muted break-all">{publicUrl}</p>
          </div>
          <CopyButton url={publicUrl} />
        </div>

        <div>
          <h2 className="font-medium text-ink mb-4">Get started</h2>
          <div className="flex flex-col gap-3">
            <Link 
              href="/dashboard/availability" 
              className="flex items-center justify-between p-4 rounded-md border border-border hover:border-forest hover:bg-forest/5 transition-colors group"
            >
              <div className="flex items-center gap-3">
                <div className={`flex items-center justify-center w-6 h-6 rounded-full border ${hasAvailability ? 'bg-forest border-forest text-paper' : 'border-muted text-transparent'}`}>
                  <IconCheck width={14} height={14} />
                </div>
                <span className={hasAvailability ? "line-through text-muted" : "text-ink"}>
                  Set your weekly availability
                </span>
              </div>
              {!hasAvailability && <IconArrowRight className="text-muted group-hover:text-forest transition-colors" width={20} height={20} />}
            </Link>

            <Link 
              href="/dashboard/event-types" 
              className="flex items-center justify-between p-4 rounded-md border border-border hover:border-forest hover:bg-forest/5 transition-colors group"
            >
              <div className="flex items-center gap-3">
                <div className={`flex items-center justify-center w-6 h-6 rounded-full border ${hasActiveEventType ? 'bg-forest border-forest text-paper' : 'border-muted text-transparent'}`}>
                  <IconCheck width={14} height={14} />
                </div>
                <span className={hasActiveEventType ? "line-through text-muted" : "text-ink"}>
                  Create an event type
                </span>
              </div>
              {!hasActiveEventType && <IconArrowRight className="text-muted group-hover:text-forest transition-colors" width={20} height={20} />}
            </Link>

            <div className="flex items-center justify-between p-4 rounded-md border border-border">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-6 h-6 rounded-full border border-muted text-transparent">
                  <IconCheck width={14} height={14} />
                </div>
                <span className="text-ink">Share your link</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}