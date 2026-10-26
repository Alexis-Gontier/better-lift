import {
  chiffresSeance,
  chronologique,
  type ExerciceDetail,
  type HistoriqueExercice,
  meilleureChargeParReps,
  pourcentagesUnRm,
  recordsExercice,
  type TypeRecord,
} from "@better-lift/shared";
import { Link } from "@tanstack/react-router";
import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts";
import { BodyMap } from "@/components/body-map";
import { ExerciseGif } from "@/components/exercise-media";
import { SummaryCard } from "@/components/summary-card";
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
import { formatKg, formatNumber, formatShortDay } from "@/lib/format";
import { jourCivil } from "@/lib/locale";

const chartConfig = {
  oneRm: { label: "1RM estimé", color: "var(--chart-2)" },
  heaviest: { label: "Meilleure charge", color: "var(--chart-4)" },
} satisfies ChartConfig;

type Seance = HistoriqueExercice[number];

/** Le jour d'une séance, au format court, dans le fuseau du web. */
const jour = (iso: string) => formatShortDay(jourCivil(iso));

/** « 47,5 × 15 · 40 × 14 » : les séries faites, la virgule française comme partout ailleurs. */
const setsText = (s: Seance) =>
  s.series
    .filter((x) => x.faite)
    .map((x) => `${x.chargeKg === null ? "—" : formatNumber(x.chargeKg)} × ${x.reps ?? "—"}`)
    .join(" · ");

function ProgressChart({ history }: { history: HistoriqueExercice }) {
  const data = chronologique(history).map((s) => {
    const c = chiffresSeance(s);
    return { date: jourCivil(s.debut), oneRm: c.unRm, heaviest: c.charge };
  });
  // Sans aucune charge notée (curl à la poulie fait sans noter le poids), pas de courbe.
  const charged = data.some((d) => d.heaviest !== null);
  return (
    <Card>
      <CardHeader>
        <CardTitle>Progression</CardTitle>
        <CardDescription>Toutes les séances</CardDescription>
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
                  (max: number) => Math.ceil((max + 5) / 5) * 5,
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

/** Le record d'un type, s'il existe. */
const recordDe = (history: HistoriqueExercice, type: TypeRecord) =>
  recordsExercice(history).find((r) => r.type === type);

/** Les pourcentages du 1RM estimé, arrondis aux 2,5 kg : de quoi régler une charge de travail. */
function OneRmPercentages({ history }: { history: HistoriqueExercice }) {
  const best = recordDe(history, "UN_RM")?.valeur ?? 0;
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
          {pourcentagesUnRm(best).map((r) => (
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
export function ExerciseMain({ history }: { history: HistoriqueExercice }) {
  return (
    <>
      <ProgressChart history={history} />
      <ExerciseHistory history={history} />
      <OneRmPercentages history={history} />
      <BestByReps history={history} />
    </>
  );
}

/**
 * Les records en lignes, comme « En bref » d'une routine (D265), avec la date de chacun. Ce sont
 * ceux de `shared` : le meilleur volume est celui d'une série.
 */
export function ExerciseFigures({ history }: { history: HistoriqueExercice }) {
  const ligne = (label: string, type: TypeRecord, valeur: (v: number) => string) => {
    const r = recordDe(history, type);
    return r ? [{ label, value: valeur(r.valeur), hint: `le ${jour(r.date)}` }] : [];
  };
  const derniere = history[0];
  return (
    <SummaryCard
      title="Records"
      rows={[
        ...ligne("Meilleure charge", "CHARGE", formatKg),
        ...ligne("1RM estimé", "UN_RM", (v) => formatKg(Math.round(v))),
        ...ligne("Meilleure série", "VOLUME", formatKg),
        ...ligne("Répétitions", "REPS", (v) => `${v} rép.`),
        {
          label: "Séances",
          value: String(history.length),
          hint: derniere ? `dernière le ${jour(derniere.debut)}` : undefined,
        },
      ]}
    />
  );
}

/** L'animation et les muscles de l'exercice, dans la colonne de droite. */
export function ExerciseLook({ exercise }: { exercise: ExerciceDetail }) {
  return (
    <>
      <Card size="sm">
        <CardHeader>
          <CardTitle>Exécution</CardTitle>
          <CardDescription>{exercise.equipement}</CardDescription>
        </CardHeader>
        <CardContent>
          <ExerciseGif name={exercise.nom} src={exercise.gif} />
        </CardContent>
      </Card>
      <Card size="sm">
        <CardHeader>
          <CardTitle>Muscles</CardTitle>
          <CardDescription>
            {exercise.cible}
            {exercise.secondaires.length ? ` · ${exercise.secondaires.join(", ")}` : ""}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mx-auto h-24 w-full max-w-32">
            <BodyMap primary={[exercise.cible]} secondary={exercise.secondaires} />
          </div>
        </CardContent>
      </Card>
    </>
  );
}

function ExerciseHistory({ history }: { history: HistoriqueExercice }) {
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
          {/* L'API rend la plus récente d'abord. */}
          {history.map((s) => {
            const c = chiffresSeance(s);
            return (
              <TableRow key={s.id}>
                <TableCell className="pl-4">
                  <Link to="/history/$id" params={{ id: s.id }} className="hover:underline">
                    {jour(s.debut)}
                  </Link>
                </TableCell>
                <TableCell className="tabular-nums">{setsText(s)}</TableCell>
                <TableCell className="text-right tabular-nums">{formatKg(c.volume)}</TableCell>
                <TableCell className="pr-4 text-right tabular-nums">
                  {c.unRm === null ? "—" : formatKg(Math.round(c.unRm))}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </Card>
  );
}

/** La meilleure charge par nombre de répétitions, de 1 à 12 : les cases vides se voient. */
function BestByReps({ history }: { history: HistoriqueExercice }) {
  const byReps = meilleureChargeParReps(history);
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
