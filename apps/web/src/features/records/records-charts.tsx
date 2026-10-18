import { Link, useNavigate } from "@tanstack/react-router";
import { Bar, BarChart, CartesianGrid, Scatter, ScatterChart, XAxis, YAxis } from "recharts";
import { BodyMap } from "@/components/body-map";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { Progress } from "@/components/ui/progress";
import { formatKg, formatShortDay, plural } from "@/lib/format";
import { estimate1rm } from "@/mocks/exercise-stats";
import { exerciseBySlug } from "@/mocks/exercises";
import { type RecordEvent, topSet } from "@/mocks/record-insights";
import { daysSince } from "@/mocks/routine-stats";
import { addDays, startOfWeek } from "@/mocks/stats";
import { TODAY } from "@/mocks/today";
import type { Insight } from "./insights";

/** « 92,5 kg × 5 », ou « 12 reps » sans charge. */
const setText = (s: { kg: number | null; reps: number }) =>
  s.kg ? `${formatKg(s.kg)} × ${s.reps}` : `${s.reps} reps`;

const signed = (n: number) => (n > 0 ? `+${n}` : n < 0 ? `−${Math.abs(n)}` : "±0");

const weekConfig = { count: { label: "Records", color: "var(--chart-1)" } } satisfies ChartConfig;

/** Les records par semaine sur la période, le total et son écart avec la période d'avant (D284). */
export function WeeklyRecordsCard({
  events,
  from,
  previous,
}: {
  events: RecordEvent[];
  /** Premier jour de la période. */
  from: string;
  /** Les records de la période d'avant ; `null` pour « Tout ». */
  previous: number | null;
}) {
  const weeks: { week: string; count: number }[] = [];
  for (let w = startOfWeek(from); w <= TODAY; w = addDays(w, 7))
    weeks.push({ week: w, count: events.filter((e) => startOfWeek(e.date) === w).length });
  return (
    <Card>
      <CardHeader>
        <CardDescription>Records battus</CardDescription>
        <CardTitle className="font-semibold text-3xl tabular-nums">{events.length}</CardTitle>
        {previous !== null && (
          <CardAction>
            <Badge variant="outline" className="tabular-nums">
              {signed(events.length - previous)} vs période d'avant
            </Badge>
          </CardAction>
        )}
      </CardHeader>
      <CardContent>
        <ChartContainer config={weekConfig} className="aspect-auto h-52 w-full">
          <BarChart data={weeks} margin={{ left: 0, right: 0 }}>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="week"
              tickLine={false}
              axisLine={false}
              tickFormatter={formatShortDay}
              minTickGap={24}
            />
            <YAxis allowDecimals={false} tickLine={false} axisLine={false} width={24} />
            <ChartTooltip
              cursor={false}
              content={
                <ChartTooltipContent
                  labelFormatter={(w) => `Semaine du ${formatShortDay(String(w))}`}
                />
              }
            />
            <Bar
              dataKey="count"
              fill="var(--color-count)"
              radius={4}
              minPointSize={2}
              isAnimationActive={false}
            />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}

const muscleConfig = { count: { label: "Records", color: "var(--chart-2)" } } satisfies ChartConfig;

/** Où tombent les records : la silhouette et les barres par muscle (D284). */
export function MuscleRecordsCard({ events }: { events: RecordEvent[] }) {
  const counts = new Map<string, number>();
  for (const e of events) {
    const muscle = exerciseBySlug(e.slug)?.muscle ?? "Autre";
    counts.set(muscle, (counts.get(muscle) ?? 0) + 1);
  }
  const data = [...counts.entries()]
    .map(([muscle, count]) => ({ muscle, count }))
    .sort((a, b) => b.count - a.count);
  return (
    <Card>
      <CardHeader>
        <CardTitle>Par muscle</CardTitle>
        <CardDescription>Les muscles qui progressent, en foncé les trois premiers</CardDescription>
      </CardHeader>
      <CardContent className="flex items-center gap-4">
        <div className="h-56 w-40 shrink-0">
          <BodyMap
            primary={data.slice(0, 3).map((d) => d.muscle)}
            secondary={data.slice(3).map((d) => d.muscle)}
          />
        </div>
        <ChartContainer config={muscleConfig} className="aspect-auto h-52 min-w-0 flex-1">
          <BarChart data={data} layout="vertical" margin={{ left: 0, right: 24 }}>
            <XAxis type="number" hide allowDecimals={false} />
            <YAxis
              type="category"
              dataKey="muscle"
              tickLine={false}
              axisLine={false}
              width={104}
              interval={0}
            />
            <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
            <Bar
              dataKey="count"
              fill="var(--color-count)"
              radius={4}
              isAnimationActive={false}
              label={{ position: "right", className: "fill-foreground text-xs" }}
            />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}

/** Où en est la dernière séance face au record : 97 % veut dire qu'il est tout proche. */
function closeness(i: Insight): number {
  const last = i.history.at(-1);
  const top = last && topSet(last);
  if (!top || !i.reach) return 0;
  return i.reach.bodyweight
    ? top.reps / i.reach.record
    : estimate1rm(top.kg ?? 0, top.reps) / i.reach.record;
}

/** Les records à portée, en jauges : la dernière séance en % du record, et la série qui suffit. */
export function ReachCard({ insights }: { insights: Insight[] }) {
  const rows = insights
    .filter((i) => i.reach)
    .map((i) => ({ i, pct: closeness(i) }))
    .sort((a, b) => b.pct - a.pct);
  return (
    <Card className="gap-0 pb-2">
      <CardHeader className="pb-3">
        <CardTitle>À portée</CardTitle>
        <CardDescription>
          La dernière séance face au record, de 90 à 100 % ; la série qui suffit
        </CardDescription>
        <CardAction>
          <Badge variant="outline">{plural(rows.length, "exercice")}</Badge>
        </CardAction>
      </CardHeader>
      {rows.map(({ i, pct }) => (
        <Link
          key={i.slug}
          to="/exercises/$slug"
          params={{ slug: i.slug }}
          className="grid grid-cols-[minmax(0,10rem)_minmax(0,1fr)_2.5rem_auto] items-center gap-3 px-6 py-1.5 transition-colors hover:bg-muted/40"
        >
          <span className="truncate text-sm" title={i.name}>
            {i.name}
          </span>
          {/* De 90 à 100 % : en dessous, ce n'est plus « à portée » ; une jauge de 0 à 100 serait pleine partout. */}
          <Progress
            value={Math.max(0, Math.min(100, (pct - 0.9) * 1000))}
            aria-label={`${Math.round(pct * 100)} % du record`}
          />
          <span className="text-right text-muted-foreground text-xs tabular-nums">
            {Math.round(pct * 100)} %
          </span>
          <span className="w-28 text-right text-sm tabular-nums">
            {i.reach && setText(i.reach.target)}
          </span>
        </Link>
      ))}
    </Card>
  );
}

/** Les exercices qui stagnent, en barres : le nombre de jours sans record. */
export function StalledCard({ insights }: { insights: Insight[] }) {
  const rows = insights
    .filter((i) => i.stalled)
    .map((i) => ({
      i,
      days: daysSince(i.lastRecord ?? i.history[0]?.date ?? TODAY, TODAY),
    }))
    .sort((a, b) => b.days - a.days);
  const max = Math.max(1, ...rows.map((r) => r.days));
  return (
    <Card className="gap-0 pb-2">
      <CardHeader className="pb-3">
        <CardTitle>En stagnation</CardTitle>
        <CardDescription>Jours sans record, sur des exercices faits souvent</CardDescription>
        <CardAction>
          <Badge variant="outline">{plural(rows.length, "exercice")}</Badge>
        </CardAction>
      </CardHeader>
      {rows.map(({ i, days }) => (
        <Link
          key={i.slug}
          to="/exercises/$slug"
          params={{ slug: i.slug }}
          className="grid grid-cols-[minmax(0,10rem)_minmax(0,1fr)_3rem] items-center gap-3 px-6 py-1.5 transition-colors hover:bg-muted/40"
        >
          <span className="truncate text-sm" title={i.name}>
            {i.name}
          </span>
          <span className="h-2 rounded-full bg-muted">
            <span
              className="block h-full rounded-full bg-foreground/50"
              style={{ width: `${(days / max) * 100}%` }}
            />
          </span>
          <span className="text-right text-muted-foreground text-xs tabular-nums">
            {i.lastRecord ? `${days} j` : "jamais"}
          </span>
        </Link>
      ))}
    </Card>
  );
}

const DAY_MS = 86_400_000;
const toMs = (date: string) => Date.parse(`${date}T00:00:00Z`);
const fromMs = (ms: number) => new Date(ms).toISOString().slice(0, 10);
const dotConfig = { y: { label: "Record", color: "var(--foreground)" } } satisfies ChartConfig;

type Dot = { x: number; y: string; sessionId: string; set: string };

/**
 * La chronologie en nuage (D284) : une ligne par exercice, un point par record. Un clic sur un
 * point ouvre la séance où il a été battu.
 */
export function ChronologyCard({ events, from }: { events: RecordEvent[]; from: string }) {
  const navigate = useNavigate();
  const data: Dot[] = events.map((e) => ({
    x: toMs(e.date),
    y: exerciseBySlug(e.slug)?.name ?? e.slug,
    sessionId: e.sessionId,
    set: setText(e),
  }));
  const names = [...new Set(data.map((d) => d.y))];
  return (
    <Card>
      <CardHeader>
        <CardTitle>Chronologie</CardTitle>
        <CardDescription>Un point par record ; un clic ouvre la séance</CardDescription>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <p className="py-6 text-center text-muted-foreground text-sm">
            Aucun record sur la période.
          </p>
        ) : (
          <ChartContainer
            config={dotConfig}
            className="aspect-auto w-full"
            style={{ height: names.length * 28 + 40 }}
          >
            <ScatterChart margin={{ left: 0, right: 16, top: 8 }}>
              <CartesianGrid horizontal={false} />
              <XAxis
                type="number"
                dataKey="x"
                domain={[toMs(from) - DAY_MS, toMs(TODAY) + DAY_MS]}
                tickLine={false}
                axisLine={false}
                tickFormatter={(ms: number) => formatShortDay(fromMs(ms))}
                minTickGap={32}
              />
              <YAxis
                type="category"
                dataKey="y"
                allowDuplicatedCategory={false}
                tickLine={false}
                axisLine={false}
                width={200}
                interval={0}
              />
              <ChartTooltip
                cursor={false}
                content={
                  <ChartTooltipContent
                    hideIndicator
                    labelFormatter={(_, p) => {
                      const d = p[0]?.payload as Dot | undefined;
                      return d ? `${d.y} · ${formatShortDay(fromMs(d.x))}` : "";
                    }}
                    formatter={(_, __, item) => (item.payload as Dot).set}
                  />
                }
              />
              <Scatter
                data={data}
                fill="var(--color-y)"
                isAnimationActive={false}
                className="cursor-pointer"
                onClick={(d) =>
                  navigate({
                    to: "/history/$id",
                    params: { id: (d as unknown as { payload: Dot }).payload.sessionId },
                  })
                }
              />
            </ScatterChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
}
