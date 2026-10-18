import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import type { ReactNode } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  XAxis,
  YAxis,
} from "recharts";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  type ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { formatDaysAgo, formatKg, formatNumber, formatShortDay, plural } from "@/lib/format";
import { cn } from "@/lib/utils";
import { WEIGHT_GOAL } from "@/mocks/body";
import { best1rmOf } from "@/mocks/exercise-stats";
import type { RecordEvent } from "@/mocks/record-insights";
import { daysSince } from "@/mocks/routine-stats";
import type { MockSession } from "@/mocks/sessions";
import { addDays, movingAverage, weeklyCount } from "@/mocks/stats";
import { TODAY } from "@/mocks/today";
import { mockWeights } from "@/mocks/weights";
import type { FileRouteTypes } from "@/routeTree.gen";
import { INSIGHTS, type Insight, insightOf } from "../records/insights";
import { RecordRow } from "../records/record-row";

const signedPct = (n: number) => `${n > 0 ? "+" : n < 0 ? "−" : "±"}${formatNumber(Math.abs(n))} %`;

/** Une carte de l'Accueil (D282) : un sujet, son graphique, et le lien vers sa page. */
function OverviewCard({
  title,
  description,
  action,
  to,
  linkLabel,
  className,
  children,
}: {
  title: string;
  description: string;
  action?: ReactNode;
  to: FileRouteTypes["to"];
  linkLabel: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <Card className={cn("gap-4", className)}>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
        {action && <CardAction>{action}</CardAction>}
      </CardHeader>
      <CardContent className="flex flex-1 flex-col gap-4">{children}</CardContent>
      <CardFooter>
        <Button variant="ghost" size="sm" className="-ml-2" asChild>
          <Link to={to}>
            {linkLabel} <ArrowRight data-icon="inline-end" />
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}

const countConfig = { count: { label: "Records", color: "var(--chart-1)" } } satisfies ChartConfig;

/** Les records par semaine sur douze semaines, les trois derniers, et ce qui est à portée. */
export function RecordsCard({ events, className }: { events: RecordEvent[]; className?: string }) {
  const weeks = weeklyCount(events, TODAY, 12);
  const reach = INSIGHTS.filter((i) => i.reach).length;
  return (
    <OverviewCard
      title="Records"
      description="Records battus par semaine, sur 12 semaines"
      action={<Badge variant="outline">{plural(reach, "record")} à portée</Badge>}
      to="/records"
      linkLabel="Voir les records"
      className={className}
    >
      <ChartContainer config={countConfig} className="aspect-auto h-44 w-full">
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
      <div className="-mx-6 flex flex-col">
        {events.slice(0, 3).map((e) => (
          <RecordRow key={e.id} event={e} />
        ))}
      </div>
    </OverviewCard>
  );
}

const sparkConfig = {
  value: { label: "1RM estimé", color: "var(--foreground)" },
} satisfies ChartConfig;

/** Les épinglés en lignes : 1RM estimé, courbe sur 3 mois, évolution sur 4 semaines. */
export function PinnedCard({ slugs, className }: { slugs: string[]; className?: string }) {
  const lifts = slugs.flatMap((s) => insightOf(s) ?? []);
  const from = addDays(TODAY, -91);
  return (
    <OverviewCard
      title="Épinglés"
      description="1RM estimé, 3 mois"
      to="/exercises"
      linkLabel="Voir les exercices"
      className={className}
    >
      <div className="-mx-6 flex flex-col">
        {lifts.map((i) => (
          <Link
            key={i.slug}
            to="/exercises/$slug"
            params={{ slug: i.slug }}
            className="grid grid-cols-[minmax(0,1fr)_4rem_3.5rem] items-center gap-3 border-t px-6 py-2 transition-colors hover:bg-muted/40"
          >
            <span className="flex min-w-0 flex-col">
              <span className="truncate text-sm">{i.name}</span>
              <span className="text-muted-foreground text-xs tabular-nums">
                {i.best1rm > 0 ? formatKg(Math.round(i.best1rm)) : i.muscle}
              </span>
            </span>
            <ChartContainer config={sparkConfig} className="aspect-auto h-8 w-full">
              <LineChart
                data={i.history.filter((p) => p.date >= from).map((p) => ({ value: best1rmOf(p) }))}
                margin={{ top: 2, bottom: 2, left: 0, right: 0 }}
              >
                <YAxis hide domain={["dataMin", "dataMax"]} />
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
            <span className="text-right text-muted-foreground text-xs tabular-nums">
              {i.trend ? signedPct(i.trend.change) : "—"}
            </span>
          </Link>
        ))}
      </div>
    </OverviewCard>
  );
}

const LIFT_COLORS = ["var(--chart-1)", "var(--chart-2)", "var(--chart-3)"];

/** « Développé couché incliné aux haltères » → « Développé couché… » : la légende tient sur une ligne. */
const shortName = (name: string) => {
  const words = name.split(" ");
  return words.length > 2 ? `${words.slice(0, 2).join(" ")}…` : name;
};

/**
 * La force des trois premiers épinglés chargés, en % de leur 1RM au début des 3 mois : des
 * exercices de charges différentes se lisent sur la même échelle.
 */
export function StrengthCard({ slugs }: { slugs: string[] }) {
  const from = addDays(TODAY, -91);
  const lifts: Insight[] = slugs
    .flatMap((s) => insightOf(s) ?? [])
    .filter((i) => i.best1rm > 0)
    .slice(0, 3);
  const rows = new Map<string, Record<string, number | string>>();
  for (const lift of lifts) {
    const points = lift.history.filter((p) => p.date >= from);
    const base = points[0] ? best1rmOf(points[0]) : 0;
    for (const p of points) {
      const row = rows.get(p.date) ?? { date: p.date };
      row[lift.slug] = base > 0 ? Math.round((best1rmOf(p) / base) * 1000) / 10 : 100;
      rows.set(p.date, row);
    }
  }
  const data = [...rows.values()].sort((a, b) => String(a.date).localeCompare(String(b.date)));
  // Graduations par pas de 10 % : Recharts, laissé seul, gradue « 95, 104, 113, 130 ».
  const values = data.flatMap((r) => lifts.map((l) => Number(r[l.slug] ?? 100)));
  const low = Math.floor(Math.min(100, ...values) / 10) * 10;
  const high = Math.ceil(Math.max(100, ...values) / 10) * 10;
  const ticks = Array.from({ length: (high - low) / 10 + 1 }, (_, i) => low + i * 10);
  const config = Object.fromEntries(
    lifts.map((l, i) => [l.slug, { label: shortName(l.name), color: LIFT_COLORS[i] }]),
  ) satisfies ChartConfig;
  return (
    <OverviewCard
      title="Force"
      description="1RM estimé des épinglés, en % du départ"
      to="/progress"
      linkLabel="Voir la progression"
    >
      <ChartContainer config={config} className="aspect-auto h-48 w-full">
        <LineChart data={data} margin={{ left: 0, right: 8 }}>
          <CartesianGrid vertical={false} />
          <XAxis
            dataKey="date"
            tickLine={false}
            axisLine={false}
            tickFormatter={formatShortDay}
            minTickGap={32}
          />
          <YAxis
            tickLine={false}
            axisLine={false}
            domain={[low, high]}
            ticks={ticks}
            tickFormatter={(v: number) => String(v)}
            width={32}
          />
          <ReferenceLine y={100} stroke="var(--muted-foreground)" strokeDasharray="4 4" />
          <ChartTooltip
            content={
              <ChartTooltipContent
                labelFormatter={(d) => formatShortDay(String(d))}
                formatter={(v, name) => (
                  <span className="flex w-full justify-between gap-4">
                    <span className="text-muted-foreground">{config[String(name)]?.label}</span>
                    <span className="tabular-nums">{formatNumber(Number(v))} %</span>
                  </span>
                )}
              />
            }
          />
          <ChartLegend content={<ChartLegendContent />} />
          {lifts.map((l) => (
            <Line
              key={l.slug}
              dataKey={l.slug}
              type="monotone"
              stroke={`var(--color-${l.slug})`}
              strokeWidth={2}
              dot={false}
              connectNulls
              isAnimationActive={false}
            />
          ))}
        </LineChart>
      </ChartContainer>
    </OverviewCard>
  );
}

const routineConfig = {
  count: { label: "Séances", color: "var(--chart-2)" },
} satisfies ChartConfig;

/** Les séances par routine sur 3 mois, et la dernière faite. */
export function RoutinesCard({ sessions }: { sessions: MockSession[] }) {
  const from = addDays(TODAY, -91);
  const counts = new Map<string, number>();
  for (const s of sessions)
    if (s.date >= from) counts.set(s.routine, (counts.get(s.routine) ?? 0) + 1);
  const data = [...counts.entries()]
    .map(([routine, count]) => ({ routine, count }))
    .sort((a, b) => b.count - a.count);
  const last = sessions[0];
  return (
    <OverviewCard
      title="Routines"
      description={
        last
          ? `Séances sur 3 mois · dernière : ${last.routine}, ${formatDaysAgo(daysSince(last.date, TODAY)).toLowerCase()}`
          : "Séances sur 3 mois"
      }
      to="/routines"
      linkLabel="Voir les routines"
    >
      <ChartContainer config={routineConfig} className="aspect-auto h-48 w-full">
        <BarChart data={data} layout="vertical" margin={{ left: 0, right: 16 }}>
          <XAxis type="number" hide allowDecimals={false} />
          <YAxis type="category" dataKey="routine" tickLine={false} axisLine={false} width={72} />
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
    </OverviewCard>
  );
}

const weightConfig = {
  avg: { label: "Moyenne 7 jours", color: "var(--chart-1)" },
} satisfies ChartConfig;

/** Le poids moyen sur 90 jours, l'objectif en pointillés. */
export function BodyCard() {
  const avg = movingAverage(
    mockWeights.map((w) => w.kg),
    7,
  );
  const data = mockWeights.map((w, i) => ({
    date: w.date,
    avg: Math.round((avg[i] ?? w.kg) * 10) / 10,
  }));
  const last = data.at(-1)?.avg ?? 0;
  return (
    <OverviewCard
      title="Corps"
      description={`Poids, moyenne 7 jours · encore ${formatKg(Math.max(0, Math.round((last - WEIGHT_GOAL) * 10) / 10))} avant l'objectif`}
      to="/body"
      linkLabel="Voir le corps"
    >
      <ChartContainer config={weightConfig} className="aspect-auto h-48 w-full">
        <AreaChart data={data} margin={{ left: 0, right: 8 }}>
          <CartesianGrid vertical={false} />
          <XAxis
            dataKey="date"
            tickLine={false}
            axisLine={false}
            tickFormatter={formatShortDay}
            minTickGap={32}
          />
          <YAxis
            tickLine={false}
            axisLine={false}
            width={32}
            domain={[WEIGHT_GOAL - 1, "dataMax + 0.5"]}
            tickFormatter={(v: number) => `${Math.round(v)}`}
          />
          <ChartTooltip
            content={
              <ChartTooltipContent
                labelFormatter={(d) => formatShortDay(String(d))}
                formatter={(v) => formatKg(Number(v))}
              />
            }
          />
          <ReferenceLine y={WEIGHT_GOAL} stroke="var(--muted-foreground)" strokeDasharray="4 4" />
          <Area
            dataKey="avg"
            type="monotone"
            stroke="var(--color-avg)"
            fill="var(--color-avg)"
            fillOpacity={0.15}
            strokeWidth={2}
            isAnimationActive={false}
          />
        </AreaChart>
      </ChartContainer>
    </OverviewCard>
  );
}
