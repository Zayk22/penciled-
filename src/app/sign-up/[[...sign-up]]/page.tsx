import { SignUp } from "@clerk/nextjs";
import { Suspense } from "react";

export default function Page() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-paper px-4">
      <Suspense fallback={<div className="text-muted">Loading sign-up...</div>}>
        <SignUp />
      </Suspense>
    </div>
  );
}