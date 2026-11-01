import { SignIn } from "@clerk/nextjs";
import { Suspense } from "react";
import Link from "next/link";

export default function Page() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-paper px-4 py-12">
      <Suspense fallback={<div className="text-muted">Loading...</div>}>
        <SignIn />
      </Suspense>
      
      <div className="mt-6 text-center text-sm text-muted">
        Don&apos;t have an account?{" "}
        <Link href="/sign-up" className="text-forest hover:underline font-medium">
          Sign up
        </Link>
      </div>
    </div>
  );
}