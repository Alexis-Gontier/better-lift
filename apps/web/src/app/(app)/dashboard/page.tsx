import { type Metadata } from "next";
import { Suspense } from "react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@better-lift/ui/components/card";

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
    <div className="space-y-8">
      <header className="space-y-1">
        <h1 className="font-heading text-2xl font-semibold tracking-tight">Tableau de bord</h1>
        <p className="text-muted-foreground">
          Zone authentifiée. Les cartes de la doc 05 arriveront avec les séances.
        </p>
      </header>

      <Suspense fallback={null}>
        <VerificationNotice />
      </Suspense>

      {/*
        `max-w-xl` : ce bloc de contrôle est une liste de paires libellé/valeur,
        pas un tableau de bord. Étalé sur les 1152 px de la coquille, l'œil
        devrait traverser l'écran entre l'intitulé et sa valeur.
      */}
      <Card className="max-w-xl">
        <CardHeader>
          <CardTitle>Session</CardTitle>
          <CardDescription>
            Deux lectures indépendantes de la même session, dont une via l’API.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <SessionPanel />
        </CardContent>
      </Card>
    </div>
  );
}
