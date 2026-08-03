import Link from "next/link";

import { Button } from "@better-lift/ui/components/button";
import { Card, CardContent, CardHeader, CardTitle } from "@better-lift/ui/components/card";

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
      <header className="flex flex-col gap-1">
        <h1 className="text-3xl font-semibold tracking-tight">better-lift</h1>
        <p className="text-muted-foreground">Préparez vos séances, remplissez-les sans friction.</p>
      </header>

      <div className="flex gap-3">
        <Button asChild size="lg">
          <Link href="/signup">Créer un compte</Link>
        </Button>
        <Button asChild size="lg" variant="outline">
          <Link href="/login">Se connecter</Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
            Chaîne web → API
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ApiStatus />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
            Logique métier partagée
          </CardTitle>
        </CardHeader>
        <CardContent>
          <CoreCheck />
        </CardContent>
      </Card>
    </main>
  );
}
