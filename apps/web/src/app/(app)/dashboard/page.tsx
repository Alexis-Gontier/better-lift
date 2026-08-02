import { type Metadata } from "next";
import { Suspense } from "react";

import { SessionPanel } from "@/features/auth/session-panel";
import { VerificationNotice } from "@/features/auth/verification-notice";

export const metadata: Metadata = { title: "Tableau de bord — better-lift" };

/**
 * Le tableau de bord de la doc 05 (cartes KPI, volume hebdomadaire, régularité)
 * attend les données que la V1 n'a pas encore produites. En attendant, cette
 * page a une fonction réelle : c'est la **première route protégée du web**, et
 * elle rend visible ce que `proxy.ts` garde.
 */
export default function DashboardPage() {
  return (
    <main className="space-y-8">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Tableau de bord</h1>
        <p className="text-muted-foreground">
          Zone authentifiée. Les cartes de la doc 05 arriveront avec les séances.
        </p>
      </header>

      <Suspense fallback={null}>
        <VerificationNotice />
      </Suspense>

      <section className="rounded-xl bg-card p-5">
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Session
        </h2>
        <SessionPanel />
      </section>
    </main>
  );
}
