import { Link } from "@tanstack/react-router";
import { Line, LineChart, YAxis } from "recharts";
import { BodyMap } from "@/components/body-map";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { type ChartConfig, ChartContainer } from "@/components/ui/chart";
import { Skeleton } from "@/components/ui/skeleton";
import { formatKg, formatMinutes, formatNumber, formatShortDay, plural } from "@/lib/format";
import { cn } from "@/lib/utils";
import { exerciseHistory } from "@/mocks/exercise-history";
import { best1rmOf } from "@/mocks/exercise-stats";
import { exerciseBySlug } from "@/mocks/exercises";
import { sessionDetail } from "@/mocks/history";
import {
  inPeriod,
  type Period,
  periodFigures,
  periodStart,
  previousRange,
  setsPerMuscle,
  strengthTrend,
  weeklySeries,
  weeksOf,
} from "@/mocks/progress";
import type { MockSession } from "@/mocks/sessions";
import { weekStreak } from "@/mocks/stats";
import { TODAY } from "@/mocks/today";

/** « +0,3 », « −12 % », « ±0 » : l'écart avec la période précédente, à une décimale. */
function signed(diff: number, unit = ""): string {
  const sign = diff > 0 ? "+" : diff < 0 ? "−" : "±";
  return `${sign}${formatNumber(Math.abs(diff))}${unit}`;
}
const percent = (now: number, was: number) =>
  was === 0 ? undefined : signed(Math.round(((now - was) / was) * 100), " %");

/**
 * Les chiffres de la période en bandeau (D267), chacun comparé à la période de même longueur
 * juste avant : on lit d'un coup d'œil si l'on s'entraîne plus, ou moins.
 */
function Figures({ sessions, period }: { sessions: MockSession[]; period: Period }) {
  const weeks = weeksOf(period);
  const now = periodFigures(sessions, periodStart(period, TODAY), TODAY, weeks);
  const before = previousRange(period, TODAY);
  const was = periodFigures(sessions, before.from, before.to, weeks);
  const hasBefore = was.count > 0;
  const figures = [
    {
      label: "Séances par semaine",
      value: formatNumber(now.perWeek),
      delta: hasBefore ? signed(Math.round((now.perWeek - was.perWeek) * 10) / 10) : undefined,
    },
    {
      label: "Volume par semaine",
      value: formatKg(now.volumePerWeek),
      delta: hasBefore ? percent(now.volumePerWeek, was.volumePerWeek) : undefined,
    },
    {
      label: "Durée moyenne",
      value: formatMinutes(now.avgMinutes),
      delta: hasBefore ? signed(now.avgMinutes - was.avgMinutes, " min") : undefined,
    },
    {
      label: "Records battus",
      value: String(now.records),
      delta: hasBefore ? signed(now.records - was.records) : undefined,
    },
  ];
  return (
    <Card size="sm">
      <CardContent className="grid grid-cols-2 gap-x-6 gap-y-4 @3xl:grid-cols-4">
        {figures.map((f) => (
          <div key={f.label} className="flex flex-col gap-0.5">
            <span className="text-muted-foreground text-xs">{f.label}</span>
            <span className="font-semibold text-2xl tabular-nums">{f.value}</span>
            <span className="text-muted-foreground text-xs tabular-nums">
              {f.delta ? `${f.delta} vs période précédente` : "Pas de période précédente"}
            </span>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

const sparkConfig = {
  value: { label: "1RM estimé", color: "var(--foreground)" },
} satisfies ChartConfig;

/**
 * La force (D267) : une carte par exercice principal — les plus faits de la période —, son 1RM
 * estimé et son évolution. Un clic ouvre la fiche, où l'on trouve le détail.
 */
function Strength({ sessions, period }: { sessions: MockSession[]; period: Period }) {
  const counts = new Map<string, number>();
  for (const s of sessions)
    for (const e of sessionDetail(s).exercises) counts.set(e.slug, (counts.get(e.slug) ?? 0) + 1);
  const lifts = [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .flatMap(([slug]) => {
      const history = inPeriod(exerciseHistory(slug), period, TODAY);
      const trend = strengthTrend(history.map((p) => ({ date: p.date, value: best1rmOf(p) })));
      return trend ? [{ slug, trend }] : [];
    })
    .slice(0, 6);
  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="font-medium text-lg">Force</h2>
        <span className="text-muted-foreground text-sm">
          1RM estimé des exercices les plus faits
        </span>
      </div>
      {lifts.length === 0 ? (
        <p className="rounded-xl border border-dashed px-4 py-6 text-center text-muted-foreground text-sm">
          Il faut au moins deux séances chargées d'un exercice pour voir sa courbe.
        </p>
      ) : (
        <div className="grid gap-3 @xl:grid-cols-2 @4xl:grid-cols-3">
          {lifts.map(({ slug, trend }) => {
            const info = exerciseBySlug(slug);
            return (
              <Link key={slug} to="/exercises/$slug" params={{ slug }} className="group">
                <Card size="sm" className="gap-2 px-4 transition-colors group-hover:bg-muted/40">
                  <div className="flex items-start justify-between gap-3">
                    <span className="flex min-w-0 flex-col">
                      <span className="truncate font-medium" title={info?.name}>
                        {info?.name ?? slug}
                      </span>
                      <span className="text-muted-foreground text-xs">{info?.muscle}</span>
                    </span>
                    <Badge variant="outline" className="shrink-0 tabular-nums">
                      {signed(trend.change, " %")}
                    </Badge>
                  </div>
                  <ChartContainer config={sparkConfig} className="aspect-auto h-12 w-full">
                    <LineChart
                      data={trend.points}
                      margin={{ top: 4, bottom: 4, left: 0, right: 0 }}
                    >
                      <YAxis hide domain={["dataMin - 2", "dataMax + 2"]} />
                      <Line
                        dataKey="value"
                        type="monotone"
                        stroke="var(--color-value)"
                        strokeWidth={1.5}
                        dot={false}
                        isAnimationActive={false}
                      />
                    </LineChart>
                  </ChartContainer>
                  <span className="text-muted-foreground text-xs tabular-nums">
                    Aujourd'hui {formatKg(Math.round(trend.last))}
                  </span>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </section>
  );
}

/** Repère courant pour doser un muscle : 10 à 20 séries de travail par semaine. */
const BAND = { from: 10, to: 20 } as const;

/** Les séries par muscle et par semaine, face à la zone repère, avec la silhouette (D267). */
function SetsPerMuscle({ sessions, period }: { sessions: MockSession[]; period: Period }) {
  const details = sessions.map((s) => ({
    exercises: sessionDetail(s).exercises.map((e) => ({
      muscle: exerciseBySlug(e.slug)?.muscle ?? "Autre",
      sets: e.sets.length,
    })),
  }));
  const muscles = setsPerMuscle(details, weeksOf(period));
  const scale = Math.max(BAND.to + 4, ...muscles.map((m) => m.perWeek));
  const at = (n: number) => `${(n / scale) * 100}%`;
  return (
    <Card>
      <CardHeader>
        <CardTitle>Séries par muscle</CardTitle>
        <CardDescription>
          Par semaine, en moyenne ; la bande grise marque le repère de {BAND.from} à {BAND.to}.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4 @xl:flex-row @xl:items-center">
        <div className="flex min-w-0 flex-1 flex-col gap-2">
          {muscles.map((m) => (
            <div
              key={m.muscle}
              className="grid grid-cols-[7rem_minmax(0,1fr)_2.5rem] items-center gap-3"
            >
              <span className="truncate text-muted-foreground text-sm">{m.muscle}</span>
              <div className="relative h-2.5 rounded-full bg-muted">
                <div
                  aria-hidden
                  className="absolute inset-y-0 bg-foreground/10"
                  style={{ left: at(BAND.from), width: at(BAND.to - BAND.from) }}
                />
                <div
                  className="absolute inset-y-0 left-0 rounded-full bg-foreground/70"
                  style={{ width: at(m.perWeek) }}
                />
              </div>
              <span className="text-right text-sm tabular-nums">{formatNumber(m.perWeek)}</span>
            </div>
          ))}
        </div>
        <div className="mx-auto h-40 w-full max-w-44 shrink-0">
          <BodyMap
            primary={muscles.slice(0, 3).map((m) => m.muscle)}
            secondary={muscles.slice(3).map((m) => m.muscle)}
          />
        </div>
      </CardContent>
    </Card>
  );
}

/** La régularité : une case par semaine, plus foncée avec le nombre de séances (D267). */
function Regularity({ sessions, period }: { sessions: MockSession[]; period: Period }) {
  const weeks = weeklySeries(sessions, TODAY, weeksOf(period));
  const active = weeks.filter((w) => w.count > 0).length;
  const streak = weekStreak(sessions, TODAY);
  const tone = (n: number) =>
    n === 0
      ? "bg-muted"
      : n === 1
        ? "bg-foreground/30"
        : n === 2
          ? "bg-foreground/60"
          : "bg-foreground";
  return (
    <Card>
      <CardHeader>
        <CardTitle>Régularité</CardTitle>
        <CardDescription>
          {active} semaines sur {weeks.length} avec au moins une séance
          {streak > 1 ? ` · ${streak} d'affilée` : ""}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <div className="flex flex-wrap gap-1">
          {weeks.map((w) => (
            <span
              key={w.week}
              title={`Semaine du ${formatShortDay(w.week)} : ${plural(w.count, "séance")}`}
              className={cn("size-4 rounded-sm", tone(w.count))}
            />
          ))}
        </div>
        <div className="flex items-center gap-2 text-muted-foreground text-xs">
          <span>0</span>
          {[0, 1, 2, 3].map((n) => (
            <span key={n} className={cn("size-3 rounded-sm", tone(n))} />
          ))}
          <span>3 séances et +</span>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Progression (D267) : est-ce que je progresse ? D'abord les chiffres de la période face à la
 * précédente, puis la force exercice par exercice, la dose par muscle et la régularité. Les
 * records ont leur page (D278).
 */
export function ProgressView({ sessions, period }: { sessions: MockSession[]; period: Period }) {
  const current = inPeriod(sessions, period, TODAY);
  return (
    <>
      <Figures sessions={sessions} period={period} />
      <Strength sessions={current} period={period} />
      <div className="grid gap-4 @4xl:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        <SetsPerMuscle sessions={current} period={period} />
        <Regularity sessions={sessions} period={period} />
      </div>
    </>
  );
}

/** La page pendant le chargement : le bandeau, les cartes de force, puis les deux colonnes. */
export function ProgressSkeleton() {
  return (
    <>
      <Skeleton className="h-28 rounded-xl" />
      <Skeleton className="h-6 w-24 rounded" />
      <div className="grid gap-3 @xl:grid-cols-2 @4xl:grid-cols-3">
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <Skeleton key={i} className="h-36 rounded-xl" />
        ))}
      </div>
      <div className="grid gap-4 @4xl:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        <Skeleton className="h-96 rounded-xl" />
        <Skeleton className="h-40 rounded-xl" />
      </div>
    </>
  );
}
