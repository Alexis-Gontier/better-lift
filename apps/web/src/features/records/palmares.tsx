import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { Line, LineChart, ReferenceLine, YAxis } from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { type ChartConfig, ChartContainer } from "@/components/ui/chart";
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@/components/ui/empty";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { formatKg, formatShortDay } from "@/lib/format";
import { best1rmOf } from "@/mocks/exercise-stats";
import { MUSCLES } from "@/mocks/exercises";
import { inPeriod, type Period } from "@/mocks/progress";
import { recordDates } from "@/mocks/record-insights";
import { targetOf } from "@/mocks/targets";
import { TODAY } from "@/mocks/today";
import { INSIGHTS, type Insight } from "./insights";

const ALL = "tous";
const SORTS = [
  { value: "recent", label: "Récents" },
  { value: "1rm", label: "1RM" },
  { value: "muscle", label: "Muscle" },
] as const;
type Sort = (typeof SORTS)[number]["value"];

const config = { value: { label: "1RM estimé", color: "var(--foreground)" } } satisfies ChartConfig;

type Point = { date: string; value: number; record: boolean };

/** Un point plein sur chaque record, rien ailleurs : la courbe montre où l'on a battu. */
function RecordDot(props: { cx?: number; cy?: number; payload?: Point; index?: number }) {
  const { cx, cy, payload, index } = props;
  if (!payload?.record || cx === undefined || cy === undefined) return <g key={index} />;
  return <circle key={index} cx={cx} cy={cy} r={3} fill="var(--color-value)" />;
}

/** Un exercice du palmarès : son meilleur, sa courbe sur la période, ses records en points. */
function PalmaresCard({ insight, period }: { insight: Insight; period: Period }) {
  const charged = insight.best1rm > 0;
  const records = new Set(recordDates(insight.history));
  const points: Point[] = inPeriod(insight.history, period, TODAY).map((p) => ({
    date: p.date,
    value: charged ? Math.round(best1rmOf(p) * 10) / 10 : Math.max(...p.sets.map((s) => s.reps)),
    record: records.has(p.date),
  }));
  const best = charged
    ? formatKg(Math.round(insight.best1rm))
    : `${Math.max(...insight.history.flatMap((p) => p.sets.map((s) => s.reps)))} reps`;
  const target = targetOf(insight.slug);
  return (
    <Link to="/exercises/$slug" params={{ slug: insight.slug }} className="group rounded-xl">
      <Card size="sm" className="h-full gap-2 transition-colors group-hover:bg-muted/40">
        <CardHeader>
          <CardTitle className="truncate" title={insight.name}>
            {insight.name}
          </CardTitle>
          <CardDescription>{insight.muscle}</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          <div className="flex items-baseline gap-2">
            <span className="font-semibold text-2xl tabular-nums">{best}</span>
            <span className="text-muted-foreground text-xs">
              {charged ? "1RM estimé" : "record"}
            </span>
          </div>
          <ChartContainer config={config} className="aspect-auto h-16 w-full">
            <LineChart data={points} margin={{ top: 4, bottom: 4, left: 4, right: 4 }}>
              <YAxis
                hide
                domain={["dataMin - 2", (max: number) => Math.max(max, target ?? 0) + 2]}
              />
              {target !== undefined && (
                <ReferenceLine y={target} stroke="var(--muted-foreground)" strokeDasharray="3 3" />
              )}
              <Line
                dataKey="value"
                type="monotone"
                stroke="var(--color-value)"
                strokeOpacity={0.5}
                strokeWidth={1.5}
                dot={RecordDot}
                activeDot={false}
                isAnimationActive={false}
              />
            </LineChart>
          </ChartContainer>
          <span className="flex justify-between gap-2 text-muted-foreground text-xs tabular-nums">
            <span>
              {insight.lastRecord
                ? `Dernier record le ${formatShortDay(insight.lastRecord)}`
                : "Pas encore de record"}
            </span>
            {target !== undefined && <span>Cible {formatKg(target)}</span>}
          </span>
        </CardContent>
      </Card>
    </Link>
  );
}

/**
 * Le palmarès en cartes (D284) : un exercice fait sur la période par carte, filtré par muscle,
 * trié par record récent, par 1RM ou par muscle.
 */
export function Palmares({ period }: { period: Period }) {
  const [muscle, setMuscle] = useState(ALL);
  const [sort, setSort] = useState<Sort>("recent");
  const items = INSIGHTS.filter(
    (i) => inPeriod(i.history, period, TODAY).length > 0 && (muscle === ALL || i.muscle === muscle),
  ).sort((a, b) =>
    sort === "1rm"
      ? b.best1rm - a.best1rm
      : sort === "muscle"
        ? a.muscle.localeCompare(b.muscle, "fr") || a.name.localeCompare(b.name, "fr")
        : (b.lastRecord ?? "").localeCompare(a.lastRecord ?? ""),
  );
  return (
    <section className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-medium text-lg">Palmarès</h2>
        <ToggleGroup
          type="single"
          variant="outline"
          size="sm"
          aria-label="Trier"
          value={sort}
          onValueChange={(v) => v && setSort(v as Sort)}
        >
          {SORTS.map((s) => (
            <ToggleGroupItem key={s.value} value={s.value}>
              {s.label}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </div>
      <ToggleGroup
        type="single"
        variant="outline"
        size="sm"
        spacing={2}
        value={muscle}
        onValueChange={(v) => setMuscle(v || ALL)}
        className="flex-wrap"
      >
        <ToggleGroupItem value={ALL}>Tous les muscles</ToggleGroupItem>
        {MUSCLES.map((m) => (
          <ToggleGroupItem key={m} value={m}>
            {m}
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
      {items.length === 0 ? (
        <Empty className="border border-dashed">
          <EmptyHeader>
            <EmptyTitle>Rien sur la période</EmptyTitle>
            <EmptyDescription>
              Élargissez la période ou choisissez un autre muscle.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <div className="grid gap-3 @xl:grid-cols-2 @4xl:grid-cols-3">
          {items.map((i) => (
            <PalmaresCard key={i.slug} insight={i} period={period} />
          ))}
        </div>
      )}
    </section>
  );
}
