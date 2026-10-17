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

const setsText = (p: Performance) => p.sets.map((s) => `${s.kg ?? "—"} × ${s.reps}`).join(" · ");

function ProgressChart({ exercise, history }: { exercise: MockExercise; history: Performance[] }) {
  const goal = mockGoals.find((g) => g.slug === exercise.slug);
  const data = history.map((p) => ({
    date: p.date,
    oneRm: Math.round(best1rmOf(p) * 10) / 10,
    heaviest: heaviestOf(p),
  }));
  // Sans aucune charge notée (curl à la poulie fait sans noter le poids), pas de courbe.
  const charged = data.some((d) => d.heaviest > 0);
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Progression</CardTitle>
        <CardDescription>
          {goal ? `Objectif : ${formatKg(goal.target)} en pointillés` : "Toutes les séances"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {!charged ? (
          <p className="flex h-64 items-center justify-center text-center text-muted-foreground text-sm">
            Aucune charge notée : la courbe apparaîtra à la première série chargée.
          </p>
        ) : (
          <ChartContainer config={chartConfig} className="aspect-auto h-64 w-full">
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
                // Bornes rondes, aux 5 kg : sinon l'axe affiche « 123.3 ».
                domain={[
                  (min: number) => Math.max(0, Math.floor((min - 5) / 5) * 5),
                  (max: number) => Math.ceil((Math.max(max, goal?.target ?? 0) + 5) / 5) * 5,
                ]}
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
        )}
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
    <div className="grid gap-4 @3xl:grid-cols-3">
      <div className="@3xl:col-span-2">
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
      <Card className="@3xl:col-span-2">
        <CardHeader>
          <CardTitle>Pourcentages du 1RM</CardTitle>
          <CardDescription>
            {best > 0
              ? `Sur un 1RM estimé de ${formatKg(Math.round(best))}, arrondi aux 2,5 kg`
              : "Pas encore de série enregistrée"}
          </CardDescription>
        </CardHeader>
        {best > 0 && (
          <CardContent className="grid grid-cols-2 gap-x-6 gap-y-1 text-sm @lg:grid-cols-3 @3xl:grid-cols-4">
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
      <div className="grid gap-4 @lg:grid-cols-3">
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

/** Variante B du Résumé : la silhouette et les chiffres clés en tête, puis la courbe en pleine largeur. */
export function ExerciseSummaryHero({
  exercise,
  history,
}: {
  exercise: MockExercise;
  history: Performance[];
}) {
  const r = records(history);
  const last = history.at(-1);
  const figures = [
    {
      label: "1RM estimé",
      value: r.best1rm.value > 0 ? formatKg(Math.round(r.best1rm.value)) : "—",
    },
    { label: "Meilleure charge", value: r.heaviest.value > 0 ? formatKg(r.heaviest.value) : "—" },
    { label: "Séances", value: String(history.length) },
    { label: "Dernière fois", value: last ? formatShortDay(last.date) : "—" },
  ];
  return (
    <>
      <Card>
        <CardContent className="grid items-center gap-6 @2xl:grid-cols-[auto_1fr]">
          {/* Hauteur explicite : dans la grille, la silhouette prendrait la hauteur des chiffres. */}
          <div className="h-72 w-64 shrink-0">
            <BodyMap primary={[exercise.muscle]} secondary={exercise.secondary} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            {figures.map((f) => (
              <div key={f.label} className="flex flex-col gap-0.5">
                <span className="text-muted-foreground text-xs">{f.label}</span>
                <span className="font-semibold text-2xl tabular-nums">{f.value}</span>
              </div>
            ))}
            {exercise.note && (
              <p className="col-span-2 flex items-start gap-2 text-muted-foreground text-sm">
                <Pin className="mt-0.5 size-4 shrink-0" /> {exercise.note}
              </p>
            )}
          </div>
        </CardContent>
      </Card>
      <ProgressChart exercise={exercise} history={history} />
    </>
  );
}
