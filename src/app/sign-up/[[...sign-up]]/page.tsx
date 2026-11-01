// src/app/sign-up/[[...sign-up]]/page.tsx
import { SignUp } from "@clerk/nextjs";
import { Suspense } from "react";
import Link from "next/link";

export default function Page() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-paper px-4 py-12">
      <Suspense fallback={<div className="text-muted">Loading...</div>}>
        <SignUp />
      </Suspense>
      
      <div className="mt-6 text-center text-sm text-muted">
        Already have an account?{" "}
        <Link href="/sign-in" className="text-forest hover:underline font-medium">
          Sign in
        </Link>
      </div>
    </div>
  );
}