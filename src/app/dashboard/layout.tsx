// src/app/dashboard/layout.tsx
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { hosts } from "@/db/schema";
import { eq } from "drizzle-orm";
import { Nav } from "@/components/ui/Nav";
import { UserMenu } from "@/components/ui/UserMenu";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { userId } = await auth();
  
  if (!userId) {
    redirect("/sign-in");
  }

  // Using db.select() instead of db.query for stability
  const hostResult = await db.select().from(hosts).where(eq(hosts.clerkUserId, userId)).limit(1);
  const host = hostResult[0];

  if (!host) {
    redirect("/onboarding");
  }

  return (
    <div className="flex min-h-[100dvh] bg-paper">
      <Nav />
      
      <div className="flex-1 flex flex-col min-w-0">
        <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b border-border bg-paper px-6 md:px-8">
          <div className="text-sm font-medium text-muted">
            <span className="sm:hidden">@{host.username}</span>
          </div>
          <UserMenu username={host.username} />
        </header>
        
        <main className="flex-1 p-6 md:p-8 pb-24 md:pb-8">
          {children}
        </main>
      </div>
    </div>
  );
}