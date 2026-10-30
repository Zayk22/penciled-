import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { hosts, availabilityRules } from "@/db/schema";
import { eq, asc } from "drizzle-orm";
import { AvailabilityForm } from "@/components/ui/AvailabilityForm";
import { deleteAvailabilityRule } from "./actions";
import { IconClose } from "@/components/icons";
import Link from "next/link";

export default async function AvailabilityPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const hostResult = await db.select().from(hosts).where(eq(hosts.clerkUserId, userId)).limit(1);
  const host = hostResult[0];
  if (!host) redirect("/onboarding");

  const rules = await db.select().from(availabilityRules)
    .where(eq(availabilityRules.hostId, host.id))
    .orderBy(asc(availabilityRules.weekday), asc(availabilityRules.startTime));

  const weekdays = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const normalizeTime = (t: string) => t.substring(0, 5);

  return (
    <div className="flex flex-col gap-8 max-w-4xl mx-auto w-full">
      <div>
        <h1 className="font-serif text-3xl mb-2">Availability</h1>
        <p className="text-muted text-sm">
          Times are in <span className="font-medium text-ink">{host.timezone}</span>.{" "}
          <Link href="/dashboard/settings" className="text-forest hover:underline">
            Change time zone
          </Link>
        </p>
      </div>

      <div className="flex flex-col-reverse md:flex-row gap-8 items-start">
        <div className="flex flex-col gap-4 w-full md:w-1/2">
          <h2 className="font-medium">Add a new window</h2>
          <AvailabilityForm />
        </div>

        <div className="flex flex-col gap-4 w-full md:w-1/2">
          <h2 className="font-medium">Your weekly hours</h2>
          <div className="flex flex-col gap-3">
            {weekdays.map((day, index) => {
              const dayRules = rules.filter(r => r.weekday === index);
              
              return (
                <div key={day} className="flex flex-col gap-2 p-4 border border-border bg-surface rounded-md">
                  <p className="font-medium text-ink">{day}</p>
                  {dayRules.length === 0 ? (
                    <p className="text-sm text-muted">Unavailable</p>
                  ) : (
                    dayRules.map((rule) => (
                      <div key={rule.id} className="flex items-center justify-between">
                        <p className="text-sm text-muted">
                          {normalizeTime(rule.startTime)} – {normalizeTime(rule.endTime)}
                        </p>
                        <form action={async () => {
                          "use server";
                          await deleteAvailabilityRule(rule.id);
                        }}>
                          <button 
                            type="submit" 
                            className="flex items-center justify-center w-11 h-11 text-muted hover:text-error transition-colors rounded-md hover:bg-error/10" 
                            aria-label={`Delete ${day} ${normalizeTime(rule.startTime)} to ${normalizeTime(rule.endTime)}`}
                          >
                            <IconClose width={20} height={20} />
                          </button>
                        </form>
                      </div>
                    ))
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}