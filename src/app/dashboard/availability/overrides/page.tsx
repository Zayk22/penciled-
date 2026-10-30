import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { hosts, dateOverrides } from "@/db/schema";
import { eq, asc } from "drizzle-orm";
import { OverrideForm } from "@/components/ui/OverrideForm";
import { deleteOverride } from "./actions";
import { IconClose } from "@/components/icons";
import Link from "next/link";
import { getTodayInTimezone } from "@/lib/time";

export default async function OverridesPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const hostResult = await db.select().from(hosts).where(eq(hosts.clerkUserId, userId)).limit(1);
  const host = hostResult[0];
  if (!host) redirect("/onboarding");

  const todayHostTz = getTodayInTimezone(host.timezone);

  const overrides = await db.select().from(dateOverrides)
    .where(eq(dateOverrides.hostId, host.id))
    .orderBy(asc(dateOverrides.date))
    .then(rows => rows.filter(r => r.date >= todayHostTz));

  const normalizeTime = (t: string) => t.substring(0, 5);
  const formatDate = (dateStr: string) => {
    const [y, m, d] = dateStr.split("-").map(Number);
    const dateObj = new Date(Date.UTC(y, m - 1, d));
    return dateObj.toLocaleDateString("en-GB", { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
  };

  return (
    <div className="flex flex-col gap-8 max-w-4xl mx-auto w-full">
      <div>
        <div className="flex items-center gap-2 mb-2 text-sm text-muted">
          <Link 
            href="/dashboard/availability" 
            className="flex items-center min-h-[44px] md:min-h-0 hover:text-ink transition-colors"
          >
            Availability
          </Link>
          <span>/</span>
          <span className="text-ink font-medium">Overrides</span>
        </div>
        <h1 className="font-serif text-3xl mb-2">Date overrides</h1>
        <p className="text-muted text-sm">
          Dates are in <span className="font-medium text-ink">{host.timezone}</span>.
        </p>
      </div>

      <div className="flex flex-col-reverse md:flex-row gap-8 items-start">
        <div className="flex flex-col gap-4 w-full md:w-1/2">
          <h2 className="font-medium">Add an override</h2>
          <OverrideForm minDate={todayHostTz} />
        </div>

        <div className="flex flex-col gap-4 w-full md:w-1/2">
          <h2 className="font-medium">Upcoming overrides</h2>
          {overrides.length === 0 ? (
            <div className="p-6 border border-dashed border-border-strong rounded-md text-center text-muted text-sm">
              No upcoming overrides.
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {overrides.map((override) => (
                <div key={override.id} className="flex items-center justify-between p-4 border border-border bg-surface rounded-md">
                  <div>
                    <p className="font-medium text-ink">{formatDate(override.date)}</p>
                    <p className="text-sm text-muted">
                      {override.isBlocked ? "Blocked" : `${normalizeTime(override.startTime!)} to ${normalizeTime(override.endTime!)}`}
                    </p>
                  </div>
                  <form action={async () => {
                    "use server";
                    await deleteOverride(override.id);
                  }}>
                    <button 
                      type="submit" 
                      className="flex items-center justify-center w-11 h-11 text-muted hover:text-error transition-colors rounded-md hover:bg-error/10" 
                      aria-label={`Delete override for ${formatDate(override.date)}`}
                    >
                      <IconClose width={20} height={20} />
                    </button>
                  </form>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}