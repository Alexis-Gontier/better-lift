import { Bar, BarChart, CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts";
import { BodyMap } from "@/components/body-map";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { Progress } from "@/components/ui/progress";
import { formatKg, formatNumber, formatShortDay } from "@/lib/format";
import { exerciseBySlug } from "@/mocks/exercises";
import { sessionDetail } from "@/mocks/history";
import { inPeriod, muscleStats, PERIODS, type Period, weeklySeries } from "@/mocks/progress";
import { mockSessions } from "@/mocks/sessions";
import { TODAY } from "@/mocks/today";

const volumeConfig = { volume: { label: "Volume", color: "var(--chart-2)" } } satisfies ChartConfig;
const minutesConfig = {
  minutes: { label: "Durée moyenne", color: "var(--chart-3)" },
} satisfies ChartConfig;
const countConfig = { count: { label: "Séances", color: "var(--chart-2)" } } satisfies ChartConfig;

/** Nombre de semaines affichées : la période, plafonnée à un an. */
function weeksOf(period: Period): number {
  const days = PERIODS.find((p) => p.value === period)?.days ?? 365;
  return Math.max(1, Math.round(days / 7));
}

export function ProgressCharts({ period }: { period: Period }) {
  const sessions = inPeriod(mockSessions, period, TODAY);
  const weeks = weeksOf(period);
  const details = sessions.map((s) => ({
    exercises: sessionDetail(s).exercises.map((e) => ({
      muscle: exerciseBySlug(e.slug)?.muscle ?? "Autre",
      volume: e.sets.reduce((sum, x) => sum + x.kg * x.reps, 0),
    })),
  }));
  const muscles = muscleStats(details, weeks);
  const maxPerWeek = Math.max(1, ...muscles.map((m) => m.perWeek));
  const series = weeklySeries(sessions, TODAY, weeks);

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Volume par muscle</CardTitle>
          <CardDescription>
            Les trois plus travaillés en foncé sur la silhouette, sous le graphique
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <ChartContainer config={volumeConfig} className="h-64 w-full">
            <BarChart data={muscles} layout="vertical" margin={{ left: 8, right: 8 }}>
              <XAxis type="number" hide />
              <YAxis
                type="category"
                dataKey="muscle"
                tickLine={false}
                axisLine={false}
                width={80}
              />
              <ChartTooltip
                content={<ChartTooltipContent formatter={(v) => formatKg(Number(v))} />}
              />
              <Bar
                dataKey="volume"
                fill="var(--color-volume)"
                radius={4}
                isAnimationActive={false}
              />
            </BarChart>
          </ChartContainer>
          <BodyMap
            primary={muscles.slice(0, 3).map((m) => m.muscle)}
            secondary={muscles.slice(3).map((m) => m.muscle)}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Fréquence par muscle</CardTitle>
          <CardDescription>
            Séances par semaine où le muscle est le principal travaillé
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {muscles.map((m) => (
            <div
              key={m.muscle}
              className="grid grid-cols-[6rem_1fr_4rem] items-center gap-3 text-sm"
            >
              <span>{m.muscle}</span>
              <Progress value={(m.perWeek / maxPerWeek) * 100} />
              <span className="text-right text-muted-foreground tabular-nums">
                {formatNumber(m.perWeek)}×/sem.
              </span>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Durée des séances</CardTitle>
          <CardDescription>Moyenne par semaine, en minutes</CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer config={minutesConfig} className="h-56 w-full">
            <LineChart data={series.filter((s) => s.count > 0)} margin={{ left: 0, right: 8 }}>
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey="week"
                tickLine={false}
                axisLine={false}
                tickFormatter={formatShortDay}
                minTickGap={32}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                width={32}
                domain={["dataMin - 10", "dataMax + 10"]}
              />
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    labelFormatter={(w) => `Semaine du ${formatShortDay(String(w))}`}
                    formatter={(v) => `${v} min`}
                  />
                }
              />
              <Line
                dataKey="minutes"
                type="monotone"
                stroke="var(--color-minutes)"
                strokeWidth={2}
                dot={false}
                isAnimationActive={false}
              />
            </LineChart>
          </ChartContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Nombre de séances</CardTitle>
          <CardDescription>
            {sessions.length} séances, {formatNumber(sessions.length / weeks)} par semaine en
            moyenne
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer config={countConfig} className="h-56 w-full">
            <BarChart data={series} margin={{ left: 0, right: 8 }}>
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey="week"
                tickLine={false}
                axisLine={false}
                tickFormatter={formatShortDay}
                minTickGap={32}
              />
              <YAxis tickLine={false} axisLine={false} width={24} allowDecimals={false} />
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    labelFormatter={(w) => `Semaine du ${formatShortDay(String(w))}`}
                  />
                }
              />
              <Bar dataKey="count" fill="var(--color-count)" radius={4} isAnimationActive={false} />
            </BarChart>
          </ChartContainer>
        </CardContent>
      </Card>
    </div>
  );
}
