import React from "react";
import { IconClose } from "../icons";

export function Skeleton({ className = "" }: { className?: string }) {
  return (
    <div
      className={`rounded-md skeleton-shimmer ${className}`}
      aria-hidden="true"
    />
  );
}

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center text-center p-8 border border-dashed border-border-strong rounded-lg bg-surface/50 text-ink">
      <h3 className="font-serif text-xl mb-2">{title}</h3>
      <p className="text-muted text-sm max-w-sm mb-6">{description}</p>
      {action}
    </div>
  );
}

export function ErrorState({
  title = "Something went wrong",
  description,
  action,
}: {
  title?: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center text-center p-8 border border-error/20 rounded-lg bg-error/5">
      <div className="text-error mb-4">
        <IconClose width={32} height={32} />
      </div>
      {/* Fix #4: Heading is ink colored */}
      <h3 className="font-serif text-xl mb-2 text-ink">{title}</h3>
      <p className="text-muted text-sm max-w-sm mb-6">{description}</p>
      {action}
    </div>
  );
}