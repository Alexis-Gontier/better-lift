import { Link } from "@tanstack/react-router";
import { Pin } from "lucide-react";
import { CartesianGrid, Line, LineChart, ReferenceLine, XAxis, YAxis } from "recharts";
import { BodyMap } from "@/components/body-map";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  type ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatKg, formatShortDay } from "@/lib/format";
import {
  best1rmOf,
  bestByReps,
  heaviestOf,
  oneRmPercentages,
  type Performance,
  records,
  sessionVolume,
} from "@/mocks/exercise-stats";
import type { MockExercise } from "@/mocks/exercises";
import { mockGoals } from "@/mocks/goals";

const chartConfig = {
  oneRm: { label: "1RM estimé", color: "var(--chart-2)" },
  heaviest: { label: "Meilleure charge", color: "var(--chart-4)" },
} satisfies ChartConfig;

const setsText = (p: Performance) => p.sets.map((s) => `${s.kg} × ${s.reps}`).join(" · ");

function ProgressChart({ exercise, history }: { exercise: MockExercise; history: Performance[] }) {
  const goal = mockGoals.find((g) => g.slug === exercise.slug);
  const data = history.map((p) => ({
    date: p.date,
    oneRm: Math.round(best1rmOf(p) * 10) / 10,
    heaviest: heaviestOf(p),
  }));
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Progression</CardTitle>
        <CardDescription>
          {goal ? `Objectif : ${formatKg(goal.target)} en pointillés` : "Six derniers mois"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-64 w-full">
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
              width={40}
              domain={["dataMin - 5", goal ? goal.target + 5 : "dataMax + 5"]}
            />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  labelFormatter={(d) => formatShortDay(String(d))}
                  formatter={(v, name) => (
                    <span className="flex w-full justify-between gap-4">
                      <span className="text-muted-foreground">
                        {chartConfig[name as keyof typeof chartConfig]?.label}
                      </span>
                      <span className="tabular-nums">{formatKg(Number(v))}</span>
                    </span>
                  )}
                />
              }
            />
            <ChartLegend content={<ChartLegendContent />} />
            {goal && (
              <ReferenceLine
                y={goal.target}
                stroke="var(--muted-foreground)"
                strokeDasharray="4 4"
              />
            )}
            <Line
              dataKey="oneRm"
              type="monotone"
              stroke="var(--color-oneRm)"
              strokeWidth={2}
              dot={false}
              isAnimationActive={false}
            />
            <Line
              dataKey="heaviest"
              type="stepAfter"
              stroke="var(--color-heaviest)"
              strokeWidth={2}
              dot={false}
              isAnimationActive={false}
            />
          </LineChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}

export function ExerciseSummary({
  exercise,
  history,
}: {
  exercise: MockExercise;
  history: Performance[];
}) {
  const best = records(history).best1rm.value;
  return (
    <div className="grid gap-4 md:grid-cols-3">
      <div className="md:col-span-2">
        <ProgressChart exercise={exercise} history={history} />
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Muscles</CardTitle>
          <CardDescription>
            {exercise.muscle}
            {exercise.secondary?.length ? ` · ${exercise.secondary.join(", ")}` : ""}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-1 items-center">
          <BodyMap primary={[exercise.muscle]} secondary={exercise.secondary} />
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Pin className="size-4" /> Note épinglée
          </CardTitle>
        </CardHeader>
        <CardContent className="text-muted-foreground text-sm">
          {exercise.note ?? "Aucune note. Notez un réglage de machine ou une consigne."}
        </CardContent>
      </Card>
      <Card className="md:col-span-2">
        <CardHeader>
          <CardTitle>Pourcentages du 1RM</CardTitle>
          <CardDescription>
            {best > 0
              ? `Sur un 1RM estimé de ${formatKg(Math.round(best))}, arrondi aux 2,5 kg`
              : "Pas encore de série enregistrée"}
          </CardDescription>
        </CardHeader>
        {best > 0 && (
          <CardContent className="grid grid-cols-3 gap-x-6 gap-y-1 text-sm sm:grid-cols-4">
            {oneRmPercentages(best).map((r) => (
              <div key={r.percent} className="flex justify-between tabular-nums">
                <span className="text-muted-foreground">{r.percent} %</span>
                <span>{formatKg(r.kg)}</span>
              </div>
            ))}
          </CardContent>
        )}
      </Card>
    </div>
  );
}

export function ExerciseHistory({ history }: { history: Performance[] }) {
  return (
    <Card className="gap-0 py-0">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="pl-4">Date</TableHead>
            <TableHead>Séries (kg × répétitions)</TableHead>
            <TableHead className="text-right">Volume</TableHead>
            <TableHead className="pr-4 text-right">1RM estimé</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {[...history].reverse().map((p) => (
            <TableRow key={p.sessionId}>
              <TableCell className="pl-4">
                <Link to="/history/$id" params={{ id: p.sessionId }} className="hover:underline">
                  {formatShortDay(p.date)}
                </Link>
              </TableCell>
              <TableCell className="tabular-nums">{setsText(p)}</TableCell>
              <TableCell className="text-right tabular-nums">
                {formatKg(sessionVolume(p))}
              </TableCell>
              <TableCell className="pr-4 text-right tabular-nums">
                {formatKg(Math.round(best1rmOf(p)))}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Card>
  );
}

export function ExerciseRecords({ history }: { history: Performance[] }) {
  const r = records(history);
  const byReps = bestByReps(history);
  const tiles = [
    { label: "Meilleure charge", value: formatKg(r.heaviest.value), date: r.heaviest.date },
    {
      label: "Meilleur 1RM estimé",
      value: formatKg(Math.round(r.best1rm.value)),
      date: r.best1rm.date,
    },
    { label: "Meilleur volume", value: formatKg(r.bestVolume.value), date: r.bestVolume.date },
  ];
  return (
    <>
      <div className="grid gap-4 sm:grid-cols-3">
        {tiles.map((t) => (
          <Card key={t.label} size="sm">
            <CardHeader>
              <CardDescription>{t.label}</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-1">
              <span className="font-semibold text-2xl tabular-nums">{t.value}</span>
              <span className="text-muted-foreground text-xs">le {formatShortDay(t.date)}</span>
            </CardContent>
          </Card>
        ))}
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Meilleure charge par nombre de répétitions</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          {Array.from({ length: 12 }, (_, i) => i + 1).map((reps) => {
            const kg = byReps.get(reps);
            return (
              <div
                key={reps}
                className="flex w-20 flex-col items-center rounded-lg border px-2 py-1.5 data-[empty=true]:border-dashed data-[empty=true]:text-muted-foreground"
                data-empty={!kg}
              >
                <span className="text-muted-foreground text-xs">{reps} rép.</span>
                <span className="text-sm tabular-nums">{kg ? formatKg(kg) : "—"}</span>
              </div>
            );
          })}
        </CardContent>
      </Card>
    </>
  );
}
