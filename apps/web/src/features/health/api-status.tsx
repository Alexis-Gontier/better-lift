"use client";

import { useHealth, useVersion } from "@better-lift/api-client";

import { apiClient } from "@/lib/api";

const DOT = {
  ok: "bg-accent",
  degraded: "bg-amber-400",
  down: "bg-danger",
} as const;

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4 py-1.5">
      <dt className="text-sm text-ink-muted">{label}</dt>
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
    return <p className="text-sm text-ink-muted">Interrogation de l’API…</p>;
  }

  if (health.isError) {
    return (
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <span className={`size-2.5 rounded-full ${DOT.down}`} aria-hidden />
          <span className="font-medium">API injoignable</span>
        </div>
        <p className="text-sm text-ink-muted">{health.error.message}</p>
        <p className="text-sm text-ink-muted">
          Vérifier que <code className="font-mono">pnpm dev</code> a bien démarré l’API sur le port
          3001.
        </p>
      </div>
    );
  }

  const { status, db, version: apiVersion, uptimeSec } = health.data;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <span className={`size-2.5 rounded-full ${DOT[status]}`} aria-hidden />
        <span className="font-medium">
          {status === "ok" ? "API opérationnelle" : "API dégradée"}
        </span>
      </div>

      <dl className="divide-y divide-white/5">
        <Row label="Base de données" value={db === "ok" ? "connectée" : "injoignable"} />
        <Row label="Version API" value={apiVersion} />
        <Row label="Logique métier" value={version.data?.core ?? "…"} />
        <Row label="Uptime" value={`${uptimeSec} s`} />
      </dl>
    </div>
  );
}
