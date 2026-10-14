import { avecCharge, type PointSeance, pointsExercice, tendance } from "@better-lift/shared";
import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { historyOptions } from "@/features/exercises/queries";
import { formatSet } from "@/features/exercises/record-badge";
import { TIME_ZONE } from "@/lib/time-zone";

/** Le nombre de séances que montre la mini-courbe : la fiche porte le reste. */
const POINTS = 8;

const ARROW = { hausse: "↗", stable: "→", baisse: "↘" } as const;
const TREND_LABEL = { hausse: "en hausse", stable: "stable", baisse: "en baisse" } as const;

/**
 * La bande d'analyse d'une carte de l'éditeur (D214) : la dernière perf, sa tendance et une
 * mini-courbe des dernières séances, sur TOUT l'historique de l'exercice. Elle mène à la fiche.
 * Composant à part : on peut le déplacer ou le retirer sans toucher l'éditeur.
 */
export function ExerciseTrend({
  slug,
  name,
  last,
}: {
  slug: string;
  name: string;
  /** La meilleure série de la dernière séance (D67), déjà lue par l'éditeur. */
  last: { reps: number | null; chargeKg: number | null } | null;
}) {
  const history = useQuery(historyOptions(slug));
  // En échec, la bande se tait : la carte reste éditable.
  if (history.isError) return null;
  if (history.isPending) return <div className="h-11 border-t-2 border-border bg-muted/40" />;

  const loaded = avecCharge(history.data);
  const all = pointsExercice(history.data, "tout", new Date().toISOString(), TIME_ZONE);
  const value = (p: PointSeance) => (loaded ? (p.chargeMax ?? 0) : p.reps);
  const values = all.map(value);
  const trend = tendance(values.slice(-POINTS));
  const isRecord = values.length > 1 && values.at(-1) === Math.max(...values);

  return (
    <Link
      to="/exercises/$slug"
      params={{ slug }}
      className="flex h-11 items-center gap-3 border-t-2 border-border bg-muted/40 px-4 text-sm outline-none hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset"
      aria-label={`Analyse de ${name} : ouvrir sa fiche`}
    >
      {all.length === 0 ? (
        <span className="text-muted-foreground">Pas encore fait</span>
      ) : (
        <>
          <span className="text-muted-foreground">Dernière</span>
          <span className="font-bold">{last ? formatSet(last.chargeKg, last.reps) : "—"}</span>
          {trend ? (
            <span
              title={`${loaded ? "Charge max" : "Reps"} ${TREND_LABEL[trend]} sur les dernières séances`}
              // La hausse prend le contour orange du record (D28) ; le reste reste à l'encre.
              className={
                trend === "hausse"
                  ? "rounded-base border-2 border-main bg-main/15 px-1.5 text-xs leading-5 font-bold text-main-ink"
                  : "rounded-base border-2 border-border px-1.5 text-xs leading-5 font-bold"
              }
            >
              {ARROW[trend]}
            </span>
          ) : null}
          <Sparkline values={values.slice(-POINTS)} record={isRecord} />
        </>
      )}
    </Link>
  );
}

/** Une courbe sans axes, à l'encre ; le dernier point en orange s'il est un record. */
function Sparkline({ values, record }: { values: number[]; record: boolean }) {
  if (values.length < 2) return null;
  const w = 96;
  const h = 24;
  const min = Math.min(...values);
  const span = Math.max(...values) - min || 1;
  const pts = values.map(
    (v, i) =>
      [3 + (i * (w - 6)) / (values.length - 1), 3 + (h - 6) * (1 - (v - min) / span)] as const,
  );
  const [x, y] = pts.at(-1) as readonly [number, number];
  return (
    <svg
      width={w}
      height={h}
      viewBox={`0 0 ${w} ${h}`}
      aria-hidden="true"
      className="ml-auto shrink-0"
    >
      <polyline
        points={pts.map((p) => p.join(",")).join(" ")}
        fill="none"
        stroke="var(--foreground)"
        strokeWidth={2}
        strokeLinejoin="round"
      />
      <circle
        cx={x}
        cy={y}
        r={3.5}
        fill={record ? "var(--main)" : "var(--foreground)"}
        stroke="var(--foreground)"
        strokeWidth={1.5}
      />
    </svg>
  );
}
