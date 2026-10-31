// src/components/ui/PublicEventTypeCard.tsx
import Link from "next/link";
import { IconArrowRight } from "@/components/icons";

export function PublicEventTypeCard({
  hostUsername,
  eventSlug,
  title,
  description,
  durationMinutes,
}: {
  hostUsername: string;
  eventSlug: string;
  title: string;
  description: string | null;
  durationMinutes: number;
}) {
  return (
    <Link
      href={`/${hostUsername}/${eventSlug}`}
      className="group flex items-start justify-between gap-6 p-6 border border-border rounded-md bg-surface hover:border-forest focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest focus-visible:ring-offset-2 focus-visible:ring-offset-paper transition-colors min-h-[44px]"
    >
      <div className="flex-1 min-w-0">
        <h3 className="font-serif text-xl mb-1 text-ink break-words">{title}</h3>
        <p className="text-sm text-muted mb-3">{durationMinutes} minutes</p>
        {description && (
          <p className="text-sm text-ink line-clamp-2 break-words">{description}</p>
        )}
      </div>
      <div className="text-muted group-hover:text-forest transition-colors shrink-0 pt-1">
        <IconArrowRight width={20} height={20} />
      </div>
    </Link>
  );
}