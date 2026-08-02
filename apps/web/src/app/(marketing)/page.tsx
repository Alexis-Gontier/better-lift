import Link from "next/link";

import { ApiStatus } from "@/features/health/api-status";
import { CoreCheck } from "@/features/health/core-check";

/**
 * Page publique. Elle porte encore les deux preuves exigées par le critère de
 * sortie de la V0 — web → API, et `packages/core` partagé —, que la landing de
 * la doc 05 remplacera.
 *
 * Ce qui a changé en V1 : la session ne se lit plus ici. Elle a sa place dans
 * `(app)/dashboard`, derrière `proxy.ts`.
 */
export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col justify-center gap-8 px-6 py-16">
      <header className="space-y-1">
        <h1 className="text-3xl font-semibold tracking-tight">better-lift</h1>
        <p className="text-muted-foreground">Préparez vos séances, remplissez-les sans friction.</p>
      </header>

      <div className="flex gap-3">
        <Link
          href="/signup"
          className="rounded-lg bg-primary px-4 py-2 font-medium text-primary-foreground"
        >
          Créer un compte
        </Link>
        <Link href="/login" className="rounded-lg px-4 py-2 font-medium ring-1 ring-border">
          Se connecter
        </Link>
      </div>

      <section className="rounded-xl bg-card p-5">
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Chaîne web → API
        </h2>
        <ApiStatus />
      </section>

      <section className="rounded-xl bg-card p-5">
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Logique métier partagée
        </h2>
        <CoreCheck />
      </section>
    </main>
  );
}
