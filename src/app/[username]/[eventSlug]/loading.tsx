// src/app/[username]/[eventSlug]/loading.tsx
import { Skeleton } from "@/components/ui/States";
import { Logo } from "@/components/Logo";

export default function Loading() {
  return (
    <div className="min-h-[100dvh] bg-paper flex flex-col">
      <header className="border-b border-border bg-surface shrink-0">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <Skeleton className="h-6 w-16" />
          <Logo variant="mark" size={24} />
        </div>
      </header>

      <main className="flex-1 w-full max-w-5xl mx-auto md:py-12">
        <div className="bg-surface md:border border-border md:rounded-md flex flex-col md:flex-row md:h-[calc(100dvh-10rem)] md:min-h-[500px] md:max-h-[720px] md:overflow-hidden">
          
          <div className="p-6 md:p-8 md:w-1/3 md:border-r border-border flex flex-col gap-4">
            <div>
              <Skeleton className="h-8 w-3/4 mb-2" />
              <Skeleton className="h-4 w-24" />
            </div>
            <div className="flex flex-col gap-2 mt-4">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-2/3" />
            </div>
            <Skeleton className="h-4 w-48 mt-auto" />
          </div>

          <div className="flex-1 flex flex-col min-w-0">
            <div className="shrink-0 border-b border-border p-4 md:p-6 overflow-hidden">
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Skeleton key={i} className="min-w-[72px] min-h-[64px] rounded-md" />
                ))}
              </div>
            </div>

            <div className="flex-1 p-4 md:p-6 pb-28 md:pb-6">
              <Skeleton className="h-4 w-20 mb-3" />
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mb-6">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <Skeleton key={i} className="h-[44px] rounded-md" />
                ))}
              </div>
              <Skeleton className="h-4 w-24 mb-3" />
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-[44px] rounded-md" />
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}