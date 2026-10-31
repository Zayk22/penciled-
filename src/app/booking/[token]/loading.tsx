// src/app/booking/[token]/loading.tsx
import { Skeleton } from "@/components/ui/States";
import { Logo } from "@/components/Logo";

export default function Loading() {
  return (
    <div className="min-h-screen bg-paper flex flex-col">
      <header className="border-b border-border bg-surface shrink-0">
        <div className="max-w-2xl mx-auto px-4 h-16 flex items-center justify-center">
          <Logo variant="full" size={24} />
        </div>
      </header>

      <main className="flex-1 w-full max-w-2xl mx-auto px-4 py-12">
        <div className="bg-surface border border-border rounded-md p-6 md:p-8">
          <div className="text-center mb-8 flex flex-col items-center">
            <Skeleton className="h-9 w-3/4 mb-2" />
            <Skeleton className="h-5 w-1/2" />
          </div>

          <div className="h-px bg-border mb-8" />

          <div className="flex flex-col gap-6">
            <div>
              <Skeleton className="h-7 w-1/2 mb-2" />
              <Skeleton className="h-4 w-24" />
            </div>

            <div className="bg-paper border border-border rounded-md p-4">
              <Skeleton className="h-5 w-48 mb-2" />
              <Skeleton className="h-5 w-32 mb-3" />
              <Skeleton className="h-3 w-40" />
            </div>

            <div>
              <Skeleton className="h-4 w-16 mb-2" />
              <Skeleton className="h-4 w-32" />
            </div>

            <div>
              <Skeleton className="h-4 w-16 mb-2" />
              <Skeleton className="h-4 w-64" />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}