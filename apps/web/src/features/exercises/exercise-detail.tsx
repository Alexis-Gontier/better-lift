import { Link } from "@tanstack/react-router";
import { CartesianGrid, Line, LineChart, ReferenceLine, XAxis, YAxis } from "recharts";
import { BodyMap } from "@/components/body-map";
import { ExerciseGif } from "@/components/exercise-media";
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
    <Card>
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

/** Les pourcentages du 1RM estimé, arrondis aux 2,5 kg : de quoi régler une charge de travail. */
function OneRmPercentages({ history }: { history: Performance[] }) {
  const best = records(history).best1rm.value;
  return (
    <Card>
      <CardHeader>
        <CardTitle>Pourcentages du 1RM</CardTitle>
        <CardDescription>
          {best > 0
            ? `Sur un 1RM estimé de ${formatKg(Math.round(best))}, arrondi aux 2,5 kg`
            : "Pas encore de série chargée"}
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
  );
}

/**
 * La colonne principale de la fiche (D264) : la progression, l'historique des séances, les
 * pourcentages du 1RM et la meilleure charge par nombre de répétitions, d'un seul défilement.
 */
export function ExerciseMain({
  exercise,
  history,
}: {
  exercise: MockExercise;
  history: Performance[];
}) {
  return (
    <>
      <ProgressChart exercise={exercise} history={history} />
      <ExerciseHistory history={history} />
      <OneRmPercentages history={history} />
      <BestByReps history={history} />
    </>
  );
}

/** Les records en mini-cartes, comme les chiffres d'une routine (D255). */
export function ExerciseFigures({ history }: { history: Performance[] }) {
  const r = records(history);
  const last = history.at(-1);
  const tiles = [
    { label: "Meilleure charge", value: formatKg(r.heaviest.value), date: r.heaviest.date },
    { label: "1RM estimé", value: formatKg(Math.round(r.best1rm.value)), date: r.best1rm.date },
    { label: "Meilleur volume", value: formatKg(r.bestVolume.value), date: r.bestVolume.date },
    { label: "Séances", value: String(history.length), date: last?.date },
  ];
  return (
    <div className="grid gap-2 @[13rem]:grid-cols-2">
      {tiles.map((t) => (
        <Card key={t.label} size="sm" className="gap-0.5 px-3">
          <span className="text-muted-foreground text-xs">{t.label}</span>
          <span className="font-semibold tabular-nums">{t.value}</span>
          {t.date && (
            <span className="text-muted-foreground text-xs">
              {t.label === "Séances" ? "dernière le " : "le "}
              {formatShortDay(t.date)}
            </span>
          )}
        </Card>
      ))}
    </div>
  );
}

/** L'animation et les muscles de l'exercice, dans la colonne de droite. */
export function ExerciseLook({ exercise }: { exercise: MockExercise }) {
  return (
    <>
      <Card size="sm">
        <CardHeader>
          <CardTitle>Exécution</CardTitle>
          <CardDescription>{exercise.equipment}</CardDescription>
        </CardHeader>
        <CardContent>
          <ExerciseGif name={exercise.name} />
        </CardContent>
      </Card>
      <Card size="sm">
        <CardHeader>
          <CardTitle>Muscles</CardTitle>
          <CardDescription>
            {exercise.muscle}
            {exercise.secondary?.length ? ` · ${exercise.secondary.join(", ")}` : ""}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mx-auto h-24 w-full max-w-32">
            <BodyMap primary={[exercise.muscle]} secondary={exercise.secondary} />
          </div>
        </CardContent>
      </Card>
    </>
  );
}

function ExerciseHistory({ history }: { history: Performance[] }) {
  return (
    <Card className="gap-0 pb-0">
      <CardHeader className="pb-3">
        <CardTitle>Historique</CardTitle>
        <CardDescription>Chaque séance mène à son relevé.</CardDescription>
      </CardHeader>
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

/** La meilleure charge par nombre de répétitions, de 1 à 12 : les cases vides se voient. */
function BestByReps({ history }: { history: Performance[] }) {
  const byReps = bestByReps(history);
  return (
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
  );
}
