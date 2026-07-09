import { Suspense } from "react";
import { StaffLoginForm } from "@/components/auth/StaffLoginForm";

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center bg-gem-ink">
          <p className="text-gem-mist/50">Loading…</p>
        </main>
      }
    >
      <StaffLoginForm />
    </Suspense>
  );
}
