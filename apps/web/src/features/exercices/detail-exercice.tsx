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
import { DansEnTete } from "@/components/shell/en-tete-page";
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
import { BoutonFermer } from "@/features/routines/bouton-fermer";
import { FUSEAU } from "@/lib/fuseau";
import { SYSTEME_UNITES } from "@/lib/unites";
import { AnimationExercice } from "./animation-exercice";
import { BadgeRecord, formaterSerie } from "./badge-record";
import { courbe } from "./calculs";

const kg = (v: number) => formaterCharge(v, SYSTEME_UNITES);
const DATE_COURTE = new Intl.DateTimeFormat("fr-FR", {
  day: "numeric",
  month: "short",
  year: "2-digit",
  timeZone: FUSEAU,
});

/**
 * La fiche d'un exercice (D141) : une page qui défile — l'exercice, sa
 * progression (1RM estimé et sa courbe), ses records, son historique, ses
 * consignes. `undefined` : en chargement ; `null` : en échec.
 */
export function DetailExercice({
  exercice,
  records,
  historique,
  onFermer,
}: {
  exercice: ExerciceDetail;
  records: RecordExercice[] | null | undefined;
  historique: HistoriqueExercice | null | undefined;
  onFermer: () => void;
}) {
  return (
    <ScrollArea className="h-full">
      <div className="flex flex-col gap-4 px-6 py-5">
        <DansEnTete titre={exercice.nom}>
          <BoutonFermer onFermer={onFermer} />
        </DansEnTete>
        <header className="flex items-start gap-5">
          <AnimationExercice
            key={exercice.gif ?? exercice.slug}
            gif={exercice.gif}
            nom={exercice.nom}
          />
          <div className="min-w-0 flex-1">
            {/* Le nom est dans le fil d'Ariane (D157) ; ici, ce qui le complète. */}
            <p className="text-[13px] text-muted-foreground">{exercice.nomAnglais}</p>
            <p className="mt-2 text-[13px] text-foreground">
              {LIBELLE_GROUPE[exercice.groupe]} · {exercice.equipement}
            </p>
            <p className="mt-1 text-sm">
              {exercice.cible}
              {exercice.secondaires.length > 0 ? (
                <span className="text-muted-foreground"> · {exercice.secondaires.join(", ")}</span>
              ) : null}
            </p>
          </div>
        </header>

        {historique === undefined ? (
          <Bloc titre="1RM estimé">
            <p className="text-sm text-muted-foreground">Chargement…</p>
          </Bloc>
        ) : historique === null ? (
          <Bloc titre="1RM estimé">
            <p className="text-sm text-muted-foreground">La progression n'a pas pu être chargée.</p>
          </Bloc>
        ) : (
          <Progression historique={historique} />
        )}

        <Records records={records} />
        {historique && historique.length > 0 ? <Historique historique={historique} /> : null}

        {exercice.instructions.length > 0 ? (
          <Bloc titre="Exécution">
            <ol className="flex flex-col gap-2">
              {exercice.instructions.map((etape, i) => (
                <li key={etape} className="flex gap-3 text-sm leading-relaxed">
                  <span className="w-4 shrink-0 text-right font-bold text-muted-foreground">
                    {i + 1}
                  </span>
                  <span>{etape}</span>
                </li>
              ))}
            </ol>
          </Bloc>
        ) : null}
      </div>
    </ScrollArea>
  );
}

function Bloc({
  titre,
  detail,
  children,
}: {
  titre: string;
  detail?: ReactNode;
  children: ReactNode;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{titre}</CardTitle>
        {detail ? <CardAction className="text-xs text-foreground">{detail}</CardAction> : null}
      </CardHeader>
      <CardContent className="flex flex-col gap-3">{children}</CardContent>
    </Card>
  );
}

const CONFIG = { valeur: { label: "1RM estimé" } } satisfies ChartConfig;

/**
 * Le 1RM estimé et sa courbe, séance par séance (D141, D159). Le dernier point en orange s'il
 * est record. `courbe()` ne sert plus qu'aux chiffres (min, max, écart, record) : le tracé
 * est celui de Recharts.
 */
function Progression({ historique }: { historique: HistoriqueExercice }) {
  const points = courbeUnRm(historique);
  const c = courbe(points, 1, 1);
  const dernier = points.at(-1);
  const premier = points[0];

  if (!c || !dernier || !premier) {
    return (
      <Bloc titre="1RM estimé">
        <p className="text-sm text-muted-foreground">
          Pas encore de série avec charge : la courbe apparaîtra après ta première séance.
        </p>
      </Bloc>
    );
  }

  return (
    <Bloc
      titre="1RM estimé"
      detail={`${points.length} ${points.length > 1 ? "séances" : "séance"}`}
    >
      <div className="flex items-baseline gap-3">
        <p className="chiffre text-[44px]">{kg(dernier.valeur)}</p>
        {points.length > 1 ? (
          <p className="text-[13px] text-foreground">
            {c.ecartKg === 0
              ? "stable depuis le début"
              : `${c.ecartKg > 0 ? "↗ +" : "↘ −"}${kg(Math.abs(c.ecartKg))} depuis le ${formatJour(premier.date, FUSEAU)}`}
          </p>
        ) : null}
      </div>
      <ChartContainer
        config={CONFIG}
        className="aspect-auto h-40 w-full"
        role="img"
        aria-label={`Courbe du 1RM estimé sur ${points.length} séances, de ${kg(premier.valeur)} à ${kg(dernier.valeur)}`}
      >
        <LineChart data={points} margin={{ top: 8, right: 8, bottom: 0, left: 8 }}>
          <YAxis hide domain={["dataMin", "dataMax"]} />
          <ChartTooltip
            cursor={false}
            content={
              <ChartTooltipContent
                hideIndicator
                labelFormatter={(_, charge) =>
                  formatJour(String(charge[0]?.payload?.date ?? ""), FUSEAU)
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
              const fin = index === points.length - 1;
              return (
                <circle
                  key={index}
                  cx={cx}
                  cy={cy}
                  r={fin ? 5 : 3}
                  fill={fin && c.record ? "var(--main)" : "var(--foreground)"}
                />
              );
            }}
          />
        </LineChart>
      </ChartContainer>
      <div className="flex justify-between text-[11px] text-muted-foreground">
        <span>{DATE_COURTE.format(new Date(premier.date))}</span>
        <span>
          min {kg(c.min)} · max {kg(c.max)}
        </span>
        <span>{DATE_COURTE.format(new Date(dernier.date))}</span>
      </div>
    </Bloc>
  );
}

function Records({ records }: { records: RecordExercice[] | null | undefined }) {
  return (
    <Bloc titre="Records">
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
              {/* Le record est un CONTOUR (D28) : orange foncé en texte sur fond teinté. */}
              <BadgeRecord libelle={LIBELLE_RECORD[r.type]} />
              <p className="chiffre mt-2 text-[26px]">
                {/* 1RM et volume sont DÉRIVÉS : la valeur, puis la série qui l'a donnée. */}
                {r.type === "UN_RM" || r.type === "VOLUME"
                  ? kg(r.valeur)
                  : formaterSerie(r.chargeKg, r.reps)}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {r.type === "UN_RM" || r.type === "VOLUME"
                  ? `${formaterSerie(r.chargeKg, r.reps)} · `
                  : ""}
                {formatJour(r.date, FUSEAU)}
              </p>
            </li>
          ))}
        </ul>
      )}
    </Bloc>
  );
}

/** Chaque séance de l'exercice : ses séries faites, et le meilleur 1RM qu'elles donnent. */
function Historique({ historique }: { historique: HistoriqueExercice }) {
  return (
    <Bloc
      titre="Historique"
      detail={`${historique.length} ${historique.length > 1 ? "séances" : "séance"}`}
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
          {historique.map((s) => {
            const unRm = courbeUnRm([s])[0]?.valeur;
            const faites = s.series.filter((x) => x.faite && x.type !== "ECHAUFFEMENT");
            return (
              <TableRow key={s.id} className="align-top hover:bg-transparent">
                <TableCell className="px-0 text-foreground">
                  {DATE_COURTE.format(new Date(s.debut))}
                </TableCell>
                <TableCell>
                  <Link
                    to="/seances/$id"
                    params={{ id: s.id }}
                    className="font-semibold hover:underline hover:underline-offset-4"
                  >
                    {s.nom}
                  </Link>
                </TableCell>
                <TableCell className="whitespace-normal text-foreground">
                  {faites.length > 0
                    ? faites.map((x) => formaterSerie(x.chargeKg, x.reps)).join(" · ")
                    : "—"}
                </TableCell>
                <TableCell className="px-0 text-right">{unRm ? kg(unRm) : "—"}</TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </Bloc>
  );
}
