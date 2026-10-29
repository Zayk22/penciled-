import { auth } from "@clerk/nextjs/server";
import { UserButton } from "@clerk/nextjs";

export default async function DashboardPage() {
  const { userId } = await auth();

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <header className="flex justify-between items-center border-b border-border pb-4 mb-8">
        <h1 className="font-serif text-3xl">Dashboard</h1>
        <UserButton />
      </header>
      
      <div className="bg-surface p-6 rounded-md border border-border">
        <p className="text-ink">You are signed in as <span className="font-mono text-sm">{userId}</span>.</p>
      </div>
    </div>
  );
}