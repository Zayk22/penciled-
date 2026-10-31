// src/app/design/page.tsx
import Link from "next/link";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Skeleton, EmptyState, ErrorState } from "@/components/ui/States";
import { IconArrowRight, IconChevronLeft, IconChevronRight, IconCheck, IconClose } from "@/components/icons";
import { IconChevronLeft as BackIcon } from "@/components/icons";

export const metadata = {
  title: "Design system · Penciled",
  robots: {
    index: false,
    follow: false,
  },
};

export default function DesignSystemPage() {
  return (
    <main className="min-h-screen p-6 md:p-12 lg:p-24 max-w-5xl mx-auto flex flex-col gap-16 overflow-x-hidden">
      <div className="mb-4">
        <Link href="/" className="inline-flex items-center text-sm text-muted hover:text-ink transition-colors min-h-[44px]">
          <BackIcon width={16} height={16} className="mr-1" />
          Back
        </Link>
      </div>

      <header className="border-b border-border pb-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="font-serif text-3xl md:text-4xl mb-2">Design system</h1>
          <p className="text-muted">Components, typography, and color tokens.</p>
        </div>
        <Logo variant="full" />
      </header>

      <section className="flex flex-col gap-6">
        <h2 className="font-sans font-medium text-sm tracking-widest uppercase text-forest border-b border-border pb-2">
          01. Type Scale
        </h2>
        <div className="flex flex-col gap-4">
          <p className="font-serif text-4xl md:text-5xl tracking-tight">Display 1 (Fraunces)</p>
          <p className="font-serif text-2xl md:text-3xl">Heading 1</p>
          <p className="font-sans text-lg font-medium">Subtitle (Instrument Sans)</p>
          <p className="font-sans text-base text-ink">Body text. The quick brown fox jumps over the lazy dog.</p>
          <p className="font-sans text-sm text-muted">Caption text. Used for timestamps and meta info.</p>
        </div>
      </section>

      <section className="flex flex-col gap-6">
        <h2 className="font-sans font-medium text-sm tracking-widest uppercase text-forest border-b border-border pb-2">
          02. UI Components & States
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="flex flex-col gap-6">
            <h3 className="font-sans font-medium border-b border-border pb-2">Buttons</h3>
            <div className="flex flex-wrap items-center gap-4">
              <Button variant="primary">Primary <IconArrowRight width={16} height={16} className="ml-2" /></Button>
              <Button variant="secondary">Secondary</Button>
            </div>
            <div className="flex flex-wrap items-center gap-4">
              <Button variant="primary" loading>Processing</Button>
              <Button variant="primary" disabled>Disabled</Button>
            </div>

            <h3 className="font-sans font-medium border-b border-border pb-2 mt-4">Inputs</h3>
            <Input label="Display Name" placeholder="e.g. Jane Doe" />
            <Input label="Email Address" type="email" placeholder="jane@example.com" error="Please enter a valid email." />
          </div>

          <div className="flex flex-col gap-6">
            <h3 className="font-sans font-medium border-b border-border pb-2">Page States</h3>
            
            <div className="flex flex-col gap-2">
              <span className="text-xs text-muted">Skeleton</span>
              <div className="flex flex-col gap-2">
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <span className="text-xs text-muted">Empty</span>
              <EmptyState 
                title="No bookings yet" 
                description="When someone books a time with you, it will appear here."
                action={<Button variant="secondary">Share link</Button>}
              />
            </div>

            <div className="flex flex-col gap-2">
              <span className="text-xs text-muted">Error</span>
              <ErrorState 
                description="We couldn't load your availability. Check your connection and try again."
                action={<Button variant="primary" className="bg-error hover:bg-[#8a1d17]">Retry</Button>}
              />
            </div>
          </div>
        </div>
      </section>

      <section className="flex flex-col gap-6">
        <h2 className="font-sans font-medium text-sm tracking-widest uppercase text-forest border-b border-border pb-2">
          03. Core Icons (5)
        </h2>
        <div className="grid grid-cols-3 md:grid-cols-5 gap-4 md:gap-8 items-center bg-surface p-6 border border-border rounded-md">
          <div className="flex flex-col items-center gap-2"><IconArrowRight /><span className="text-xs text-muted">Arrow</span></div>
          <div className="flex flex-col items-center gap-2"><IconChevronLeft /><span className="text-xs text-muted">Chevron L</span></div>
          <div className="flex flex-col items-center gap-2"><IconChevronRight /><span className="text-xs text-muted">Chevron R</span></div>
          <div className="flex flex-col items-center gap-2"><IconCheck /><span className="text-xs text-muted">Check</span></div>
          <div className="flex flex-col items-center gap-2"><IconClose /><span className="text-xs text-muted">Close</span></div>
        </div>
      </section>
    </main>
  );
}