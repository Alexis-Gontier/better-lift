import { ApiStatus } from "@/features/health/api-status";
import { CoreCheck } from "@/features/health/core-check";

/**
 * V0 : cette page n'a aucune ambition produit. Elle prouve les deux chaînes
 * exigées par le critère de sortie — web → API, et `packages/core` partagé.
 */
export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col justify-center gap-8 px-6 py-16">
      <header className="space-y-1">
        <h1 className="text-3xl font-semibold tracking-tight">better-lift</h1>
        <p className="text-ink-muted">Socle technique V0 — atelier web</p>
      </header>

      <section className="rounded-xl bg-surface-raised p-5">
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-ink-muted">
          Chaîne web → API
        </h2>
        <ApiStatus />
      </section>

      <section className="rounded-xl bg-surface-raised p-5">
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-ink-muted">
          Logique métier partagée
        </h2>
        <CoreCheck />
      </section>
    </main>
  );
}
