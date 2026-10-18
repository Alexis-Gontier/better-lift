import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { Area, AreaChart, Bar, BarChart, Line, LineChart, YAxis } from "recharts";
import { Badge } from "@/components/ui/badge";
import { Card, CardAction, CardContent, CardDescription, CardHeader } from "@/components/ui/card";
import { type ChartConfig, ChartContainer } from "@/components/ui/chart";
import { formatKg, formatNumber } from "@/lib/format";
import { averageDelta } from "@/mocks/body";
import { periodFigures, periodStart, previousRange } from "@/mocks/progress";
import type { RecordEvent } from "@/mocks/record-insights";
import type { MockSession } from "@/mocks/sessions";
import { addDays, movingAverage, weeklyCount, weeklyVolume } from "@/mocks/stats";
import { TODAY } from "@/mocks/today";
import { mockWeights } from "@/mocks/weights";
import type { FileRouteTypes } from "@/routeTree.gen";

const sparkConfig = {
  value: { label: "Valeur", color: "var(--foreground)" },
} satisfies ChartConfig;
const WEEKS = 12;

/** « +2 », « −3 % », « ±0 » : l'écart avec la période d'avant. */
function signed(diff: number, unit = ""): string {
  const sign = diff > 0 ? "+" : diff < 0 ? "−" : "±";
  return `${sign}${formatNumber(Math.abs(diff))}${unit}`;
}

type Spark = { kind: "bar" | "line" | "area"; data: { value: number }[] };

/** La mini-courbe d'une tuile : sans axe ni grille, la tendance seule. */
function Sparkline({ kind, data }: Spark) {
  const margin = { top: 2, bottom: 2, left: 0, right: 0 };
  return (
    <ChartContainer config={sparkConfig} className="aspect-auto h-12 w-full">
      {kind === "bar" ? (
        <BarChart data={data} margin={margin}>
          <Bar
            dataKey="value"
            fill="var(--color-value)"
            fillOpacity={0.7}
            radius={2}
            isAnimationActive={false}
          />
        </BarChart>
      ) : kind === "area" ? (
        <AreaChart data={data} margin={margin}>
          <YAxis hide domain={["dataMin", "dataMax"]} />
          <Area
            dataKey="value"
            type="monotone"
            stroke="var(--color-value)"
            fill="var(--color-value)"
            fillOpacity={0.12}
            strokeWidth={1.5}
            isAnimationActive={false}
          />
        </AreaChart>
      ) : (
        <LineChart data={data} margin={margin}>
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
      )}
    </ChartContainer>
  );
}

/** Une tuile : le chiffre, son écart, sa mini-courbe ; un clic ouvre la page qui le détaille. */
function Tile({
  label,
  value,
  delta,
  hint,
  to,
  spark,
}: {
  label: string;
  value: ReactNode;
  delta?: string;
  hint: string;
  to: FileRouteTypes["to"];
  spark: Spark;
}) {
  return (
    <Link to={to} className="group rounded-xl">
      <Card size="sm" className="h-full gap-3 transition-colors group-hover:bg-muted/40">
        <CardHeader>
          <CardDescription>{label}</CardDescription>
          <span className="font-semibold text-2xl tabular-nums">{value}</span>
          {delta && (
            <CardAction>
              <Badge variant="outline" className="tabular-nums">
                {delta}
              </Badge>
            </CardAction>
          )}
        </CardHeader>
        <CardContent className="flex flex-col gap-1">
          <Sparkline {...spark} />
          <span className="text-muted-foreground text-xs">{hint}</span>
        </CardContent>
      </Card>
    </Link>
  );
}

/**
 * La rangée de tête de l'Accueil (D282) : records, séances, volume et poids, chacun face à la
 * période d'avant, avec sa tendance sur douze semaines. Chaque tuile ouvre sa page.
 */
export function HomeTiles({
  sessions,
  events,
}: {
  sessions: MockSession[];
  events: RecordEvent[];
}) {
  const recent = events.filter((e) => e.date > addDays(TODAY, -30)).length;
  const before = events.filter(
    (e) => e.date > addDays(TODAY, -60) && e.date <= addDays(TODAY, -30),
  ).length;
  const now = periodFigures(sessions, periodStart("4s", TODAY), TODAY, 4);
  const prev = previousRange("4s", TODAY);
  const was = periodFigures(sessions, prev.from, prev.to, 4);
  const weights = movingAverage(
    mockWeights.map((w) => w.kg),
    7,
  );
  const weight = weights.at(-1) ?? 0;
  const tons = (kg: number) => `${formatNumber(Math.round(kg / 100) / 10)} t`;
  return (
    <div className="grid gap-4 @xl:grid-cols-2 @4xl:grid-cols-4">
      <Tile
        label="Records, 30 jours"
        value={recent}
        delta={signed(recent - before)}
        hint="par semaine · courbe 12 sem."
        to="/records"
        spark={{
          kind: "bar",
          data: weeklyCount(events, TODAY, WEEKS).map((w) => ({ value: w.count })),
        }}
      />
      <Tile
        label="Séances par semaine"
        value={formatNumber(now.perWeek)}
        delta={
          was.count > 0 ? signed(Math.round((now.perWeek - was.perWeek) * 10) / 10) : undefined
        }
        hint="moy. 4 sem. · courbe 12 sem."
        to="/progress"
        spark={{
          kind: "bar",
          data: weeklyCount(sessions, TODAY, WEEKS).map((w) => ({ value: w.count })),
        }}
      />
      <Tile
        label="Volume par semaine"
        value={tons(now.volumePerWeek)}
        delta={
          was.volumePerWeek > 0
            ? signed(
                Math.round(((now.volumePerWeek - was.volumePerWeek) / was.volumePerWeek) * 100),
                " %",
              )
            : undefined
        }
        hint="moy. 4 sem. · courbe 12 sem."
        to="/progress"
        spark={{
          kind: "area",
          data: weeklyVolume(sessions, TODAY, WEEKS).map((w) => ({ value: w.volume })),
        }}
      />
      <Tile
        label="Poids, moyenne 7 jours"
        value={formatKg(Math.round(weight * 10) / 10)}
        delta={signed(Math.round(averageDelta(mockWeights, 7) * 10) / 10, " kg")}
        hint="courbe 30 jours"
        to="/body"
        spark={{ kind: "line", data: weights.slice(-30).map((value) => ({ value })) }}
      />
    </div>
  );
}
