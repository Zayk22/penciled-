// src/app/page.tsx
import Link from "next/link";
import { Logo } from "@/components/Logo";
import { IconArrowRight } from "@/components/icons";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Penciled · Scheduling that gets time zones right",
  description: "Penciled is a booking page for people who meet across time zones. Share one link, set your weekly hours, and guests pick a time on their own clock.",
};

const features = [
  {
    title: "Your hours, their clock",
    description: "You set availability in your time zone. Guests see it in theirs, including across daylight saving changes.",
  },
  {
    title: "No double bookings",
    description: "Two people can't take the same time, even if they book in the same second. The database refuses the second one.",
  },
  {
    title: "No accounts for guests",
    description: "Guests pick a time, leave a name and email, and they're done.",
  },
];

export default function LandingPage() {
  const demoUsername = process.env.NEXT_PUBLIC_DEMO_USERNAME;

  return (
    <div className="min-h-screen bg-paper flex flex-col">
      <header className="w-full border-b border-border bg-surface">
        <div className="max-w-2xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center min-h-[44px]">
            <Logo variant="full" size={24} />
          </Link>
          <Link 
            href="/sign-in" 
            className="text-sm font-medium text-muted hover:text-ink transition-colors min-h-[44px] flex items-center"
          >
            Sign in
          </Link>
        </div>
      </header>

      <main className="flex-1 w-full max-w-2xl mx-auto px-4 py-12 md:py-24">
        <h1 className="font-serif text-3xl md:text-5xl mb-6 tracking-tight text-ink">
          Scheduling that gets time zones right.
        </h1>
        <p className="text-muted text-lg mb-12 leading-relaxed">
          Penciled is a booking page for people who meet across time zones. Share one link, set your weekly hours, and guests pick a time on their own clock.
        </p>

        <div className="h-px bg-border mb-8" />

        <div className="flex flex-col">
          {features.map((feature, index) => (
            <div key={feature.title}>
              <div className="py-8 flex flex-col gap-2">
                <h2 className="font-serif text-xl text-ink">{feature.title}</h2>
                <p className="text-muted">{feature.description}</p>
              </div>
              {index < features.length - 1 && <div className="h-px bg-border" />}
            </div>
          ))}
        </div>

        {demoUsername && (
          <div className="mt-12">
            <Link 
              href={`/${demoUsername}`}
              className="inline-flex items-center text-forest font-medium text-lg hover:underline underline-offset-4 min-h-[44px]"
            >
              See an example booking page
              <IconArrowRight width={20} height={20} className="ml-2" />
            </Link>
          </div>
        )}
      </main>

      <footer className="w-full border-t border-border bg-surface mt-auto">
        <div className="max-w-2xl mx-auto px-4 py-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-2 min-h-[44px] text-muted hover:text-ink transition-colors">
            <Logo variant="mark" size={18} />
            <span className="text-xs font-medium">Penciled</span>
          </Link>
          <Link 
            href="/design" 
            className="text-xs font-medium text-muted hover:text-ink transition-colors min-h-[44px] flex items-center"
          >
            Design system
          </Link>
        </div>
      </footer>
    </div>
  );
}