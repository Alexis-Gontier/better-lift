"use client";

import { useHealth, useVersion } from "@better-lift/api-client";
import { Alert, AlertDescription, AlertTitle } from "@better-lift/ui/components/alert";
import { Badge } from "@better-lift/ui/components/badge";
import { Skeleton } from "@better-lift/ui/components/skeleton";

import { apiClient } from "@/lib/api";

/**
 * L'état se dit par un libellé, pas par une couleur seule (WCAG 1.4.1). La
 * variante ne fait qu'appuyer : `secondary` pour « dégradée » plutôt qu'un
 * ambre écrit en dur — la palette n'a pas de token d'avertissement, et une
 * couleur hors palette ne suivrait ni le thème clair ni un futur changement.
 */
const STATUS_VARIANT = {
  ok: "default",
  degraded: "secondary",
  down: "destructive",
} as const;

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4 py-1.5">
      <dt className="text-sm text-muted-foreground">{label}</dt>
      <dd className="font-mono text-sm">{value}</dd>
    </div>
  );
}

/**
 * Preuve de la chaîne web → API attendue en V0 : cet écran ne sait rien de la
 * base, il ne connaît que le contrat.
 */
export function ApiStatus() {
  const health = useHealth(apiClient);
  const version = useVersion(apiClient);

  if (health.isPending) {
    return <Skeleton className="h-24 rounded-lg" />;
  }

  if (health.isError) {
    return (
      <Alert variant="destructive">
        <AlertTitle>API injoignable</AlertTitle>
        <AlertDescription className="flex flex-col gap-1">
          <span>{health.error.message}</span>
          <span>
            Vérifier que <code className="font-mono">pnpm dev</code> a bien démarré l’API sur le
            port 3001.
          </span>
        </AlertDescription>
      </Alert>
    );
  }

  const { status, db, version: apiVersion, uptimeSec } = health.data;

  return (
    <div className="flex flex-col gap-3">
      <Badge variant={STATUS_VARIANT[status]}>
        {status === "ok" ? "API opérationnelle" : "API dégradée"}
      </Badge>

      <dl className="divide-y divide-border">
        <Row label="Base de données" value={db === "ok" ? "connectée" : "injoignable"} />
        <Row label="Version API" value={apiVersion} />
        <Row label="Logique métier" value={version.data?.core ?? "…"} />
        <Row label="Uptime" value={`${uptimeSec} s`} />
      </dl>
    </div>
  );
}
