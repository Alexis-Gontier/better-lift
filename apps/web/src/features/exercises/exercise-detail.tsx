import {
  courbeUnRm,
  type ExerciceDetail,
  formaterCharge,
  formatJour,
  type HistoriqueExercice,
  LIBELLE_GROUPE,
  LIBELLE_RECORD,
  type RecordExercice,
} from "@better-lift/shared";
import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { Line, LineChart, YAxis } from "recharts";
import { Card, CardAction, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { TIME_ZONE } from "@/lib/time-zone";
import { UNIT_SYSTEM } from "@/lib/units";
import { curve } from "./calculations";
import { ExerciseAnimation } from "./exercise-animation";
import { formatSet, RecordBadge } from "./record-badge";

const kg = (v: number) => formaterCharge(v, UNIT_SYSTEM);
const SHORT_DATE = new Intl.DateTimeFormat("fr-FR", {
  day: "numeric",
  month: "short",
  year: "2-digit",
  timeZone: TIME_ZONE,
});

/**
 * La fiche d'un exercice (D141) : une page qui défile — l'exercice, sa
 * progression (1RM estimé et sa courbe), ses records, son historique, ses
 * consignes. `undefined` : en chargement ; `null` : en échec.
 */
export function ExerciseDetail({
  exercise,
  records,
  history,
}: {
  exercise: ExerciceDetail;
  records: RecordExercice[] | null | undefined;
  history: HistoriqueExercice | null | undefined;
  onClose: () => void;
}) {
  return (
    <ScrollArea className="h-full">
      <div className="flex flex-col gap-4 px-6 py-5">
        <header className="flex items-start gap-5">
          <ExerciseAnimation
            key={exercise.gif ?? exercise.slug}
            gif={exercise.gif}
            name={exercise.nom}
          />
          <div className="min-w-0 flex-1">
            {/* Le nom est dans le fil d'Ariane (D157) ; ici, ce qui le complète. */}
            <p className="text-[13px] text-muted-foreground">{exercise.nomAnglais}</p>
            <p className="mt-2 text-[13px] text-foreground">
              {LIBELLE_GROUPE[exercise.groupe]} · {exercise.equipement}
            </p>
            <p className="mt-1 text-sm">
              {exercise.cible}
              {exercise.secondaires.length > 0 ? (
                <span className="text-muted-foreground"> · {exercise.secondaires.join(", ")}</span>
              ) : null}
            </p>
          </div>
        </header>

        {history === undefined ? (
          <Block title="1RM estimé">
            <p className="text-sm text-muted-foreground">Chargement…</p>
          </Block>
        ) : history === null ? (
          <Block title="1RM estimé">
            <p className="text-sm text-muted-foreground">La progression n'a pas pu être chargée.</p>
          </Block>
        ) : (
          <Progress history={history} />
        )}

        <Records records={records} />
        {history && history.length > 0 ? <History history={history} /> : null}

        {exercise.instructions.length > 0 ? (
          <Block title="Exécution">
            <ol className="flex flex-col gap-2">
              {exercise.instructions.map((step, i) => (
                <li key={step} className="flex gap-3 text-sm leading-relaxed">
                  <span className="w-4 shrink-0 text-right font-bold text-muted-foreground">
                    {i + 1}
                  </span>
                  <span>{step}</span>
                </li>
              ))}
            </ol>
          </Block>
        ) : null}
      </div>
    </ScrollArea>
  );
}

function Block({
  title,
  detail,
  children,
}: {
  title: string;
  detail?: ReactNode;
  children: ReactNode;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {detail ? <CardAction className="text-xs text-foreground">{detail}</CardAction> : null}
      </CardHeader>
      <CardContent className="flex flex-col gap-3">{children}</CardContent>
    </Card>
  );
}

const CONFIG = { valeur: { label: "1RM estimé" } } satisfies ChartConfig;

/**
 * Le 1RM estimé et sa courbe, séance par séance (D141, D159). Le dernier point en bleu s'il
 * est record. `courbe()` ne sert plus qu'aux chiffres (min, max, écart, record) : le tracé
 * est celui de Recharts.
 */
function Progress({ history }: { history: HistoriqueExercice }) {
  const points = courbeUnRm(history);
  const c = curve(points, 1, 1);
  const last = points.at(-1);
  const first = points[0];

  if (!c || !last || !first) {
    return (
      <Block title="1RM estimé">
        <p className="text-sm text-muted-foreground">
          Pas encore de série avec charge : la courbe apparaîtra après ta première séance.
        </p>
      </Block>
    );
  }

  return (
    <Block
      title="1RM estimé"
      detail={`${points.length} ${points.length > 1 ? "séances" : "séance"}`}
    >
      <div className="flex items-baseline gap-3">
        <p className="chiffre text-[44px]">{kg(last.valeur)}</p>
        {points.length > 1 ? (
          <p className="text-[13px] text-foreground">
            {c.ecartKg === 0
              ? "stable depuis le début"
              : `${c.ecartKg > 0 ? "↗ +" : "↘ −"}${kg(Math.abs(c.ecartKg))} depuis le ${formatJour(first.date, TIME_ZONE)}`}
          </p>
        ) : null}
      </div>
      <ChartContainer
        config={CONFIG}
        className="aspect-auto h-40 w-full"
        role="img"
        aria-label={`Courbe du 1RM estimé sur ${points.length} séances, de ${kg(first.valeur)} à ${kg(last.valeur)}`}
      >
        <LineChart data={points} margin={{ top: 8, right: 8, bottom: 0, left: 8 }}>
          <YAxis hide domain={["dataMin", "dataMax"]} />
          <ChartTooltip
            cursor={false}
            content={
              <ChartTooltipContent
                hideIndicator
                labelFormatter={(_, load) =>
                  formatJour(String(load[0]?.payload?.date ?? ""), TIME_ZONE)
                }
                formatter={(v) => kg(Number(v))}
              />
            }
          />
          {/* Les animations de Recharts échappent à `prefers-reduced-motion` : coupées. */}
          <Line
            dataKey="valeur"
            type="linear"
            stroke="var(--foreground)"
            strokeWidth={2}
            isAnimationActive={false}
            dot={({ cx, cy, index }: { cx?: number; cy?: number; index?: number }) => {
              const end = index === points.length - 1;
              return (
                <circle
                  key={index}
                  cx={cx}
                  cy={cy}
                  r={end ? 5 : 3}
                  fill={end && c.record ? "var(--main)" : "var(--foreground)"}
                />
              );
            }}
          />
        </LineChart>
      </ChartContainer>
      <div className="flex justify-between text-[11px] text-muted-foreground">
        <span>{SHORT_DATE.format(new Date(first.date))}</span>
        <span>
          min {kg(c.min)} · max {kg(c.max)}
        </span>
        <span>{SHORT_DATE.format(new Date(last.date))}</span>
      </div>
    </Block>
  );
}

function Records({ records }: { records: RecordExercice[] | null | undefined }) {
  return (
    <Block title="Records">
      {records === undefined ? (
        <p className="text-sm text-muted-foreground">Chargement…</p>
      ) : records === null ? (
        <p className="text-sm text-muted-foreground">Les records n'ont pas pu être chargés.</p>
      ) : records.length === 0 ? (
        <p className="text-sm text-muted-foreground">Aucun record pour l'instant.</p>
      ) : (
        <ul className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 xl:grid-cols-4">
          {records.map((r) => (
            <li
              key={r.type}
              className="rounded-base border-2 border-border bg-secondary-background px-4 py-3"
            >
              {/* Le record est un CONTOUR (D28) : bleu foncé en texte sur fond teinté. */}
              <RecordBadge label={LIBELLE_RECORD[r.type]} />
              <p className="chiffre mt-2 text-[26px]">
                {/* 1RM et volume sont DÉRIVÉS : la valeur, puis la série qui l'a donnée. */}
                {r.type === "UN_RM" || r.type === "VOLUME"
                  ? kg(r.valeur)
                  : formatSet(r.chargeKg, r.reps)}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {r.type === "UN_RM" || r.type === "VOLUME"
                  ? `${formatSet(r.chargeKg, r.reps)} · `
                  : ""}
                {formatJour(r.date, TIME_ZONE)}
              </p>
            </li>
          ))}
        </ul>
      )}
    </Block>
  );
}

/** Chaque séance de l'exercice : ses séries faites, et le meilleur 1RM qu'elles donnent. */
function History({ history }: { history: HistoriqueExercice }) {
  return (
    <Block
      title="Historique"
      detail={`${history.length} ${history.length > 1 ? "séances" : "séance"}`}
    >
      <Table className="text-[13.5px]">
        <TableHeader>
          <TableRow className="text-xs hover:bg-transparent">
            <TableHead className="h-8 w-32 px-0 text-muted-foreground">Date</TableHead>
            <TableHead className="h-8 text-muted-foreground">Séance</TableHead>
            <TableHead className="h-8 text-muted-foreground">Séries faites</TableHead>
            <TableHead className="h-8 px-0 text-right text-muted-foreground">1RM estimé</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {history.map((s) => {
            const oneRm = courbeUnRm([s])[0]?.valeur;
            const done = s.series.filter((x) => x.faite && x.type !== "ECHAUFFEMENT");
            return (
              <TableRow key={s.id} className="align-top hover:bg-transparent">
                <TableCell className="px-0 text-foreground">
                  {SHORT_DATE.format(new Date(s.debut))}
                </TableCell>
                <TableCell>
                  <Link
                    to="/sessions/$id"
                    params={{ id: s.id }}
                    className="font-semibold hover:underline hover:underline-offset-4"
                  >
                    {s.nom}
                  </Link>
                </TableCell>
                <TableCell className="whitespace-normal text-foreground">
                  {done.length > 0
                    ? done.map((x) => formatSet(x.chargeKg, x.reps)).join(" · ")
                    : "—"}
                </TableCell>
                <TableCell className="px-0 text-right">{oneRm ? kg(oneRm) : "—"}</TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </Block>
  );
}
