// src/components/NotFoundView.tsx
import Link from "next/link";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/Button";

export function NotFoundView() {
  return (
    <div className="min-h-screen bg-paper flex flex-col items-center justify-center p-6">
      <div className="mb-8">
        <Logo variant="full" />
      </div>
      <div className="text-center max-w-md">
        <h1 className="font-serif text-2xl mb-2">Page not found</h1>
        <p className="text-muted text-sm mb-8">
          Check the link, or ask the person who sent it to you.
        </p>
        <Link href="/">
          <Button variant="secondary">Go home</Button>
        </Link>
      </div>
    </div>
  );
}