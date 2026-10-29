import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { hosts } from "@/db/schema";
import { eq } from "drizzle-orm";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { userId } = await auth();
  
  if (!userId) {
    redirect("/sign-in");
  }

  const host = await db.query.hosts.findFirst({
    where: eq(hosts.clerkUserId, userId),
  });

  if (!host) {
    redirect("/onboarding");
  }

  return <>{children}</>;
}