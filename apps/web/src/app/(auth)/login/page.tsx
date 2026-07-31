import { type Metadata } from "next";
import { Suspense } from "react";

import { SignInForm } from "@/features/auth/sign-in-form";

export const metadata: Metadata = { title: "Connexion — better-lift" };

/**
 * `SignInForm` lit `?next=` avec `useSearchParams()`, ce qui impose une
 * frontière `<Suspense>` : sans elle, Next refuse de prérendre la page et le
 * build échoue.
 */
export default function LoginPage() {
  return (
    <>
      <header className="space-y-1">
        <h1 className="text-xl font-semibold">Se connecter</h1>
        <p className="text-sm text-ink-muted">Reprenez là où vous en étiez.</p>
      </header>

      <Suspense fallback={<p className="text-sm text-ink-muted">…</p>}>
        <SignInForm />
      </Suspense>
    </>
  );
}
