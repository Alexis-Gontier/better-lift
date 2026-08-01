import { type Metadata } from "next";
import { Suspense } from "react";

import { SignUpForm } from "@/features/auth/sign-up-form";

export const metadata: Metadata = { title: "Créer un compte — better-lift" };

export default function SignUpPage() {
  return (
    <>
      <header className="space-y-1">
        <h1 className="text-xl font-semibold">Créer un compte</h1>
        <p className="text-sm text-ink-muted">Gratuit, sans limite.</p>
      </header>

      <Suspense fallback={<p className="text-sm text-ink-muted">…</p>}>
        <SignUpForm />
      </Suspense>
    </>
  );
}
