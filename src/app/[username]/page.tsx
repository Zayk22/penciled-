// src/app/[username]/page.tsx
import { notFound } from "next/navigation";
import { db } from "@/db";
import { hosts, eventTypes } from "@/db/schema";
import { eq, and, asc } from "drizzle-orm";
import { PublicEventTypeCard } from "@/components/ui/PublicEventTypeCard";
import { Logo } from "@/components/Logo";
import Link from "next/link";
import type { Metadata } from "next";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ username: string }>;
}): Promise<Metadata> {
  const { username } = await params;
  const normalized = username.toLowerCase();

  const hostResult = await db
    .select()
    .from(hosts)
    .where(eq(hosts.username, normalized))
    .limit(1);
  const host = hostResult[0];

  if (!host) {
    return { title: "Page not found · Penciled" };
  }

  return {
    title: `${host.displayName} · Penciled`,
    description: `Book a time with ${host.displayName}.`,
  };
}

export default async function PublicProfilePage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;
  const normalized = username.toLowerCase();

  const hostResult = await db
    .select()
    .from(hosts)
    .where(eq(hosts.username, normalized))
    .limit(1);
  const host = hostResult[0];
  if (!host) notFound();

  const types = await db
    .select()
    .from(eventTypes)
    .where(and(eq(eventTypes.hostId, host.id), eq(eventTypes.isActive, true)))
    .orderBy(asc(eventTypes.title));

  return (
    <div className="min-h-screen bg-paper">
      <div className="max-w-2xl mx-auto px-4 py-12 md:py-24">
        <header className="mb-8">
          <h1 className="font-serif text-3xl md:text-4xl mb-2">{host.displayName}</h1>
          <p className="text-muted">Pick a time to meet with {host.displayName}.</p>
        </header>

        <div className="h-px bg-border mb-8" />

        {types.length === 0 ? (
          <div className="p-8 border border-dashed border-border-strong rounded-md text-center">
            <p className="text-muted text-sm">No event types are available right now. Check back later.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {types.map((type) => (
              <PublicEventTypeCard
                key={type.id}
                hostUsername={host.username}
                eventSlug={type.slug}
                title={type.title}
                description={type.description}
                durationMinutes={type.durationMinutes}
              />
            ))}
          </div>
        )}

        <footer className="mt-16 pt-8 border-t border-border flex flex-col md:grid md:grid-cols-3 items-center gap-4">
          <Link href="/" className="flex justify-center md:justify-self-start items-center gap-2 min-h-[44px] text-muted hover:text-ink transition-colors">
            <Logo variant="mark" size={18} />
            <span className="text-xs font-medium">Penciled</span>
          </Link>
          <p className="text-xs text-muted order-last md:order-none text-center">
            Times are shown in your local time zone.
          </p>
          <Link href="/sign-in" className="flex justify-center md:justify-self-end items-center min-h-[44px] text-xs font-medium text-muted hover:text-ink transition-colors">
            Sign in
          </Link>
        </footer>
      </div>
    </div>
  );
}