import { type Metadata } from "next";
import { Suspense } from "react";

import { VerificationNotice } from "@/features/auth/verification-notice";
import { Dashboard } from "@/features/dashboard/dashboard";

export const metadata: Metadata = { title: "Tableau de bord — better-lift" };

/**
 * Écran d'accueil de la zone connectée (doc 05).
 *
 * La page est un Server Component qui ne fait que poser la coquille : chaque
 * bloc du tableau de bord charge ses propres données côté client et porte ses
 * propres états, si bien qu'ils ne se bloquent pas mutuellement.
 *
 * Le panneau de contrôle de session qui occupait cet écran depuis la V0 est
 * retiré : il prouvait que `proxy.ts` gardait bien la route, ce que les quatre
 * lots suivants ont largement confirmé.
 *
 * `Dashboard` lit la période dans l'URL, donc appelle `useSearchParams` : d'où
 * le `Suspense` qui l'enveloppe, sans lequel Next refuse le pré-rendu.
 */
export default function DashboardPage() {
  return (
    <div className="flex flex-1 flex-col gap-6">
      <Suspense fallback={null}>
        <VerificationNotice />
      </Suspense>

      <Suspense fallback={null}>
        <Dashboard />
      </Suspense>
    </div>
  );
}
