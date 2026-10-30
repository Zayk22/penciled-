// src/app/dashboard/settings/page.tsx
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { hosts } from "@/db/schema";
import { eq } from "drizzle-orm";
import { SettingsForm } from "@/components/ui/SettingsForm";

export default async function SettingsPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const hostResult = await db.select().from(hosts).where(eq(hosts.clerkUserId, userId)).limit(1);
  const host = hostResult[0];
  if (!host) redirect("/onboarding");

  return (
    <div className="flex flex-col gap-8 max-w-4xl mx-auto w-full">
      <div>
        <h1 className="font-serif text-3xl mb-2">Settings</h1>
        <p className="text-muted text-sm">Manage your profile and preferences.</p>
      </div>
      <div className="bg-surface border border-border rounded-md p-6 md:p-8">
        <SettingsForm host={host} />
      </div>
    </div>
  );
}