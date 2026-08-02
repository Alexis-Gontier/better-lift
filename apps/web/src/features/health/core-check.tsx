import { estimate1RM, kgToLb, setVolume } from "@better-lift/core";

/**
 * Preuve que `packages/core` est bien consommé par le web — l'autre moitié du
 * critère de sortie de la V0. Ce composant est un Server Component : le calcul
 * a lieu au rendu, sans une ligne de JavaScript envoyée au navigateur.
 */
const SAMPLE_SET = { type: "NORMAL", completed: true, reps: 5, weightKg: "102.50" } as const;

export function CoreCheck() {
  const oneRepMax = estimate1RM(SAMPLE_SET.weightKg, SAMPLE_SET.reps);
  const volume = setVolume(SAMPLE_SET, "WEIGHT_REPS");

  return (
    <dl className="divide-y divide-border">
      <div className="flex items-baseline justify-between gap-4 py-1.5">
        <dt className="text-sm text-muted-foreground">
          Série de référence — {SAMPLE_SET.reps} × {SAMPLE_SET.weightKg} kg
        </dt>
        <dd className="font-mono text-sm">{kgToLb(SAMPLE_SET.weightKg)} lb</dd>
      </div>
      <div className="flex items-baseline justify-between gap-4 py-1.5">
        <dt className="text-sm text-muted-foreground">Volume de la série</dt>
        <dd className="font-mono text-sm">{volume} kg</dd>
      </div>
      <div className="flex items-baseline justify-between gap-4 py-1.5">
        <dt className="text-sm text-muted-foreground">1RM estimé (Epley)</dt>
        <dd className="font-mono text-sm">{oneRepMax} kg</dd>
      </div>
    </dl>
  );
}
