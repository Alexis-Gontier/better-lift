import {
  avecCharge,
  formaterCharge,
  formatJour,
  type HistoriqueExercice,
  PERIODES_EXERCICE,
  type PeriodeExercice,
  type PointSeance,
  pointsExercice,
  resumePeriode,
} from "@better-lift/shared";
import { useState } from "react";
import { Line, LineChart, XAxis, YAxis } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { TIME_ZONE } from "@/lib/time-zone";
import { UNIT_SYSTEM } from "@/lib/units";

const kg = (v: number) => formaterCharge(v, UNIT_SYSTEM);
const SHORT_DATE = new Intl.DateTimeFormat("fr-FR", {
  day: "numeric",
  month: "short",
  timeZone: TIME_ZONE,
});

type Metric = "chargeMax" | "unRm" | "volume" | "reps";

const METRICS: { value: Metric; label: string; note: string; weight: boolean }[] = [
  {
    value: "chargeMax",
    label: "Charge max",
    note: "La plus lourde série de travail de chaque séance",
    weight: true,
  },
  {
    value: "unRm",
    label: "1RM estimé",
    note: "Le meilleur 1RM estimé de chaque séance (Epley)",
    weight: true,
  },
  {
    value: "volume",
    label: "Volume",
    note: "Charge × reps, séries de travail de chaque séance",
    weight: true,
  },
  {
    value: "reps",
    label: "Reps",
    note: "Les reps des séries de travail de chaque séance",
    weight: false,
  },
];

const PERIOD_LABEL: Record<PeriodeExercice, string> = {
  "1m": "1 M",
  "3m": "3 M",
  "6m": "6 M",
  "1a": "1 an",
  tout: "Tout",
};

const CONFIG = { value: { label: "Valeur", color: "var(--foreground)" } } satisfies ChartConfig;

/**
 * L'analyse d'un exercice pratiqué (D202) : quatre mesures, une période, le chiffre du
 * moment et son écart, la courbe, le résumé de la période. Échauffements exclus.
 */
export function ExerciseAnalysis({
  history,
  period,
  onPeriod,
}: {
  history: HistoriqueExercice;
  period: PeriodeExercice;
  onPeriod: (period: PeriodeExercice) => void;
}) {
  const loaded = avecCharge(history);
  // Au poids du corps, ni charge ni volume : seules les reps ont un sens (D202).
  const metrics = loaded ? METRICS : METRICS.filter((m) => !m.weight);
  const [chosen, setChosen] = useState<Metric>(loaded ? "chargeMax" : "reps");
  const metric = metrics.find((m) => m.value === chosen) ?? metrics[0];
  if (!metric) return null;

  const now = new Date().toISOString();
  const points = pointsExercice(history, period, now, TIME_ZONE);
  const allTime = pointsExercice(history, "tout", now, TIME_ZONE);
  const summary = resumePeriode(points);
  const value = (p: PointSeance) => p[metric.value] ?? 0;
  const format = (v: number) => (metric.value === "reps" ? `${v} reps` : kg(v));

  const data = points.map((p) => ({ date: p.date, value: value(p) }));
  const first = data[0];
  const last = data.at(-1);
  const best = Math.max(...allTime.map(value));
  const isRecord = last !== undefined && allTime.length > 1 && last.value === best;
  const delta = first && last ? Math.round((last.value - first.value) * 10) / 10 : 0;

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader className="flex flex-wrap items-center justify-between gap-3">
          <ToggleGroup
            type="single"
            variant="outline"
            size="sm"
            value={metric.value}
            onValueChange={(v) => v && setChosen(v as Metric)}
            aria-label="Mesure"
          >
            {metrics.map((m) => (
              <ToggleGroupItem key={m.value} value={m.value}>
                {m.label}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
          <ToggleGroup
            type="single"
            variant="outline"
            size="sm"
            value={period}
            onValueChange={(v) => v && onPeriod(v as PeriodeExercice)}
            aria-label="Période"
          >
            {PERIODES_EXERCICE.map((p) => (
              <ToggleGroupItem key={p} value={p}>
                {PERIOD_LABEL[p]}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        </CardHeader>
        <CardContent className="flex flex-col gap-1">
          {last && first ? (
            <>
              <div className="flex flex-wrap items-center gap-3">
                <p className="chiffre text-[40px]">{format(last.value)}</p>
                {data.length > 1 && delta !== 0 ? (
                  // L'écart monte : contour orange, comme un record (D28) ; il baisse : encre.
                  <span
                    className={
                      delta > 0
                        ? "rounded-base border-2 border-main bg-main/15 px-2 py-0.5 text-xs font-bold text-main-ink"
                        : "rounded-base border-2 border-border px-2 py-0.5 text-xs font-bold"
                    }
                  >
                    {delta > 0 ? "↗ +" : "↘ −"}
                    {format(Math.abs(delta))} sur la période
                  </span>
                ) : null}
              </div>
              <p className="text-xs text-muted-foreground">{metric.note} · échauffements exclus</p>
              <ChartContainer
                config={CONFIG}
                className="mt-2 aspect-auto h-56 w-full"
                role="img"
                aria-label={`${metric.label} sur ${data.length} séances, de ${format(first.value)} à ${format(last.value)}`}
              >
                <LineChart data={data} margin={{ top: 12, right: 12, bottom: 0, left: 0 }}>
                  <XAxis
                    dataKey="date"
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(d: string) => SHORT_DATE.format(new Date(d))}
                    minTickGap={32}
                  />
                  <YAxis
                    width={44}
                    tickLine={false}
                    axisLine={false}
                    domain={["auto", "auto"]}
                    tickFormatter={(v: number) => String(v)}
                  />
                  <ChartTooltip
                    cursor={false}
                    content={
                      <ChartTooltipContent
                        hideIndicator
                        labelFormatter={(_, load) =>
                          formatJour(String(load[0]?.payload?.date ?? ""), TIME_ZONE)
                        }
                        formatter={(v) => format(Number(v))}
                      />
                    }
                  />
                  {/* Les animations de Recharts échappent à `prefers-reduced-motion` : coupées. */}
                  <Line
                    dataKey="value"
                    type="linear"
                    stroke="var(--foreground)"
                    strokeWidth={2.5}
                    isAnimationActive={false}
                    dot={({ cx, cy, index }: { cx?: number; cy?: number; index?: number }) => {
                      const end = index === data.length - 1;
                      return (
                        <circle
                          key={index}
                          cx={cx}
                          cy={cy}
                          r={end ? 6 : 3.5}
                          stroke="var(--foreground)"
                          strokeWidth={end ? 2 : 0}
                          fill={end && isRecord ? "var(--main)" : "var(--foreground)"}
                        />
                      );
                    }}
                  />
                </LineChart>
              </ChartContainer>
            </>
          ) : (
            <p className="py-8 text-center text-sm text-muted-foreground">
              Aucune séance sur cette période. Élargis-la pour voir ta progression.
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Sur la période</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid grid-cols-2 gap-x-6 gap-y-3 sm:grid-cols-5">
            <Figure label="Séances" value={String(summary.seances)} />
            <Figure label="Séries de travail" value={String(summary.series)} />
            <Figure label="Reps" value={String(summary.reps)} />
            {loaded ? <Figure label="Volume total" value={kg(summary.volume)} /> : null}
            {loaded ? <Figure label="Volume / séance" value={kg(summary.volumeMoyen)} /> : null}
          </dl>
        </CardContent>
      </Card>
    </div>
  );
}

function Figure({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="chiffre text-xl">{value}</dd>
    </div>
  );
}
