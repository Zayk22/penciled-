// src/app/[username]/loading.tsx
import { Skeleton } from "@/components/ui/States";

export default function Loading() {
  return (
    <div className="min-h-screen bg-paper">
      <div className="max-w-2xl mx-auto px-4 py-12 md:py-24">
        <div className="mb-12">
          <Skeleton className="h-8 w-32 mb-8" />
          <Skeleton className="h-10 w-64 mb-2" />
          <Skeleton className="h-5 w-80" />
        </div>
        <div className="flex flex-col gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="p-6 border border-border rounded-md bg-surface">
              <Skeleton className="h-6 w-1/2 mb-2" />
              <Skeleton className="h-4 w-24 mb-3" />
              <Skeleton className="h-4 w-full" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}