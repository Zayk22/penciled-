// src/app/[username]/[eventSlug]/BookingClient.tsx
"use client";

import { useState, useSyncExternalStore, useMemo, useEffect } from "react";
import Link from "next/link";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/Button";
import { groupSlotsByDay, groupByPeriod } from "@/lib/slots/group";
import { TimezoneSelect } from "@/components/ui/TimezoneSelect";
import { IconChevronLeft } from "@/components/icons";
import { BookingForm } from "@/components/ui/BookingForm";

type ClientData = {
  eventType: { title: string; description: string | null; durationMinutes: number };
  host: { displayName: string; timezone: string; username: string };
  slots: { start: string; end: string }[];
};

const noopSubscribe = () => () => {};
const getBrowserTz = () => Intl.DateTimeFormat().resolvedOptions().timeZone;
const getServerTz = () => "UTC";

export function BookingClient({ data }: { data: ClientData }) {
  const browserTz = useSyncExternalStore(noopSubscribe, getBrowserTz, getServerTz);
  const [tzOverride, setTzOverride] = useState<string | null>(null);
  const guestTz = tzOverride ?? browserTz;

  const groupedDays = useMemo(() => groupSlotsByDay(data.slots, guestTz), [data.slots, guestTz]);

  const [preferredDate, setPreferredDate] = useState<string | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [step, setStep] = useState<"select" | "form">("select");
  const [isChangingTz, setIsChangingTz] = useState(false);
  const [showFullDesc, setShowFullDesc] = useState(false);

  // Scroll to top when switching to form step
  useEffect(() => {
    if (step === "form") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [step]);

  const effectiveDay = groupedDays.find(d => d.date === preferredDate) ?? groupedDays[0] ?? null;
  const effectiveSlotStart =
    selectedSlot && effectiveDay?.slots.some(s => s.start === selectedSlot) ? selectedSlot : null;

  const periodGroups = useMemo(
    () => (effectiveDay ? groupByPeriod(effectiveDay.slots, guestTz) : []),
    [effectiveDay, guestTz]
  );

  if (groupedDays.length === 0) {
    return (
      <div className="min-h-screen bg-paper flex flex-col items-center justify-center p-6">
        <Logo variant="full" className="mb-8" />
        <div className="text-center max-w-md">
          <h1 className="font-serif text-2xl mb-2">No times available</h1>
          <p className="text-muted text-sm mb-8">
            {data.host.displayName} has no available slots for this event type right now.
          </p>
          <Link href={`/${data.host.username}`}>
            <Button variant="secondary">Back to profile</Button>
          </Link>
        </div>
      </div>
    );
  }

  const selectedSlotLabel = effectiveDay?.slots.find(s => s.start === effectiveSlotStart)?.label;
  const showDescToggle = (data.eventType.description?.length ?? 0) > 120;

  return (
    <div className="min-h-[100dvh] bg-paper flex flex-col">
      <header className="border-b border-border bg-surface shrink-0">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link
            href={`/${data.host.username}`}
            className="flex items-center min-h-[44px] text-muted hover:text-ink transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest focus-visible:ring-offset-2 focus-visible:ring-offset-surface rounded motion-reduce:transition-none"
          >
            <IconChevronLeft width={20} height={20} className="mr-2" />
            Back
          </Link>
          <Logo variant="mark" size={24} />
        </div>
      </header>

      <main className="flex-1 w-full max-w-5xl mx-auto md:py-12">
        <div className="bg-surface md:border border-border md:rounded-md flex flex-col md:flex-row md:h-[calc(100dvh-10rem)] md:min-h-[500px] md:max-h-[720px] md:overflow-hidden">
          
          {/* LEFT PANEL — hidden on mobile when step is 'form' */}
          <div className={`p-6 md:p-8 md:w-1/3 md:border-r border-border flex-col gap-4 md:overflow-y-auto ${step === "form" ? "hidden md:flex" : "flex"}`}>
            <div>
              <h1 className="font-serif text-2xl text-ink mb-1">{data.eventType.title}</h1>
              <p className="text-muted text-sm">{data.eventType.durationMinutes} minutes</p>
            </div>

            {data.eventType.description && (
              <div>
                <p
                  className={`text-sm text-ink leading-relaxed ${
                    showFullDesc ? "" : "line-clamp-3 md:line-clamp-none"
                  }`}
                >
                  {data.eventType.description}
                </p>
                {showDescToggle && (
                  <button
                    onClick={() => setShowFullDesc(!showFullDesc)}
                    className="text-sm font-medium text-forest hover:underline text-left min-h-[44px] md:hidden"
                  >
                    {showFullDesc ? "Less" : "More"}
                  </button>
                )}
              </div>
            )}

            <div className="mt-2 flex flex-col gap-2">
              {isChangingTz ? (
                <div className="flex flex-col gap-2">
                  <TimezoneSelect
                    name="guestTz"
                    defaultValue={guestTz}
                    onChange={(tz) => setTzOverride(tz)}
                  />
                  <button
                    onClick={() => setIsChangingTz(false)}
                    className="text-xs text-forest text-left underline underline-offset-4"
                  >
                    Done
                  </button>
                </div>
              ) : (
                <p className="text-sm text-muted">
                  Times are shown in{" "}
                  <span className="font-medium text-ink">{guestTz.replace(/_/g, " ")}</span>{" "}
                  <button
                    onClick={() => setIsChangingTz(true)}
                    className="text-forest hover:underline underline-offset-4 ml-1"
                  >
                    Change
                  </button>
                </p>
              )}
            </div>
          </div>

          {/* RIGHT PANEL — switches between time selection and form */}
          <div className="flex-1 flex flex-col min-w-0">
            {step === "form" && effectiveDay && effectiveSlotStart && selectedSlotLabel ? (
              <BookingForm
                hostUsername={data.host.username}
                eventSlug={data.slots.length > 0 ? data.eventType.title : ""} // placeholder; real slug passed below
                eventTitle={data.eventType.title}
                durationMinutes={data.eventType.durationMinutes}
                selectedSlotIso={effectiveSlotStart}
                dayLabel={effectiveDay.label}
                timeLabel={selectedSlotLabel}
                guestTz={guestTz}
                onBack={() => setStep("select")}
              />
            ) : (
              <>
                {/* Day strip */}
                <div className="shrink-0 border-b border-border p-4 md:p-6 overflow-x-auto snap-x">
                  <div className="flex gap-2 min-w-max">
                    {groupedDays.map((day, idx) => {
                      const isSelected = effectiveDay?.date === day.date;
                      const prevMonth = idx > 0 ? groupedDays[idx - 1].month : null;
                      const showMonth = idx === 0 || day.month !== prevMonth;

                      return (
                        <button
                          key={day.date}
                          onClick={() => {
                            setPreferredDate(day.date);
                            setSelectedSlot(null);
                          }}
                          aria-pressed={isSelected}
                          aria-label={`${day.label}, ${day.slots.length} times available`}
                          className={`relative flex flex-col items-center justify-center min-w-[72px] min-h-[80px] rounded-md border transition-colors snap-start focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest focus-visible:ring-offset-2 focus-visible:ring-offset-surface motion-reduce:transition-none ${
                            isSelected
                              ? "bg-forest border-forest text-paper"
                              : "bg-surface border-border text-ink hover:border-forest"
                          }`}
                        >
                          <span
                            className={`text-[10px] font-medium uppercase tracking-wider h-4 leading-4 ${
                              showMonth ? "" : "invisible"
                            } ${isSelected ? "text-paper/80" : "text-muted"}`}
                          >
                            {day.month}
                          </span>
                          <span className="text-xs font-medium uppercase tracking-wider">
                            {day.label.split(",")[0]}
                          </span>
                          <span className="text-lg font-serif leading-tight">
                            {day.label.split(" ")[2]}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div aria-live="polite" aria-atomic="true" className="sr-only">
                  {effectiveDay
                    ? `${effectiveDay.slots.length} times available on ${effectiveDay.label}`
                    : ""}
                </div>

                <div className="flex-1 min-h-0 md:overflow-y-auto p-4 md:p-6 pb-28 md:pb-6">
                  {periodGroups.map((group) => (
                    <div
                      key={group.period}
                      role="group"
                      aria-labelledby={`period-${group.period}`}
                      className="mb-6 last:mb-0"
                    >
                      <h3
                        id={`period-${group.period}`}
                        className="text-sm font-medium text-muted mb-2"
                      >
                        {group.label}
                      </h3>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                        {group.slots.map((slot) => {
                          const isSelected = effectiveSlotStart === slot.start;
                          return (
                            <button
                              key={slot.start}
                              onClick={() => setSelectedSlot(slot.start)}
                              aria-pressed={isSelected}
                              className={`flex items-center justify-center min-h-[44px] rounded-md border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest focus-visible:ring-offset-2 focus-visible:ring-offset-surface motion-reduce:transition-none ${
                                isSelected
                                  ? "bg-chartreuse border-forest text-ink"
                                  : "bg-surface border-border text-ink hover:border-forest"
                              }`}
                            >
                              <span className="text-sm font-medium">{slot.label}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="fixed md:static bottom-0 left-0 right-0 md:left-auto md:right-auto z-20 bg-surface md:bg-transparent border-t md:border-t-0 border-border px-4 py-3 md:p-6 pb-[calc(0.75rem+env(safe-area-inset-bottom))] md:pb-6 shrink-0">
                  <div className="max-w-5xl mx-auto flex items-center justify-between gap-4">
                    <p className="text-sm text-muted">
                      {selectedSlotLabel ? `Selected: ${selectedSlotLabel}` : "Select a time"}
                    </p>
                    <Button
                      disabled={!effectiveSlotStart}
                      onClick={() => setStep("form")}
                      className="min-w-[120px]"
                    >
                      Continue
                    </Button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}