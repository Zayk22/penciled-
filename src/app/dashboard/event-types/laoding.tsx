// src/app/dashboard/event-types/loading.tsx
import { Skeleton } from "@/components/ui/States";

export default function LoadingEventTypes() {
  return (
    <div className="flex flex-col gap-8 max-w-4xl mx-auto w-full">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <Skeleton className="h-9 w-48 mb-2" />
          <Skeleton className="h-5 w-64" />
        </div>
        <Skeleton className="h-11 w-32 rounded-md" />
      </div>

      <div className="flex flex-col gap-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex flex-col md:flex-row md:items-center justify-between p-4 border border-border bg-surface rounded-md gap-4">
            <div className="flex-1">
              <Skeleton className="h-6 w-1/3 mb-2" />
              <Skeleton className="h-4 w-24 mb-3" />
              <Skeleton className="h-4 w-1/2" />
            </div>
            <div className="flex items-center gap-4">
              <Skeleton className="h-5 w-20" />
              <Skeleton className="h-5 w-10" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}