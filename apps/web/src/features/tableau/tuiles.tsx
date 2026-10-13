import {
  formaterCharge,
  type Preferences,
  SEMAINES_GRAPHIQUE,
  type StatsPeriode,
  semainesTenues,
} from "@better-lift/shared";
import type { ReactNode } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardAction, CardDescription, CardFooter, CardHeader } from "@/components/ui/card";
import { SYSTEME_UNITES } from "@/lib/unites";
import { ecart } from "./calculs";
import { DialogueObjectif } from "./dialogue-objectif";

const kg = (v: number) => formaterCharge(Math.round(v), SYSTEME_UNITES);

/**
 * Ligne 1 (D186) : trois chiffres comparés au même moment de la période d'avant
 * (D185), puis l'objectif. Sans stats (compte sans séance), les tuiles gardent leur place.
 */
export function Tuiles({
  stats,
  preferences,
}: {
  stats: StatsPeriode | null;
  preferences: Preferences | null;
}) {
  if (!stats) {
    return (
      <>
        <Tuile titre="Séances" valeur="—">
          aucune séance
        </Tuile>
        <Tuile titre="Séries de travail" valeur="—">
          hors échauffement
        </Tuile>
        <Tuile titre="Volume" valeur="—">
          hors échauffement
        </Tuile>
        <TuileObjectif stats={null} preferences={preferences} />
      </>
    );
  }
  const { totaux, precedents } = stats;
  return (
    <>
      <Tuile
        titre="Séances"
        valeur={totaux.seances}
        tendance={tendance(totaux.seances, precedents.seances, false)}
      >
        {avant(precedents.seances, String(precedents.seances))}
      </Tuile>
      <Tuile
        titre="Séries de travail"
        valeur={totaux.series}
        tendance={tendance(totaux.series, precedents.series, true)}
      >
        {avant(precedents.series, String(precedents.series))}
      </Tuile>
      <Tuile
        titre="Volume"
        valeur={kg(totaux.volumeKg)}
        tendance={tendance(totaux.volumeKg, precedents.volumeKg, true)}
      >
        {avant(precedents.volumeKg, kg(precedents.volumeKg))}
      </Tuile>
      <TuileObjectif stats={stats} preferences={preferences} />
    </>
  );
}

/** « 2 / 3 cette semaine », une barre, puis la régularité sur douze semaines (D186). */
function TuileObjectif({
  stats,
  preferences,
}: {
  stats: StatsPeriode | null;
  preferences: Preferences | null;
}) {
  const objectif = preferences?.objectifHebdo ?? null;
  const regler = (libelle: string) =>
    preferences ? (
      <DialogueObjectif preferences={preferences}>
        <button type="button" className="underline underline-offset-4 hover:text-foreground">
          {libelle}
        </button>
      </DialogueObjectif>
    ) : null;

  if (!objectif) {
    return (
      <Tuile titre="Objectif" valeur="—">
        {regler("Fixer un objectif hebdomadaire")}
      </Tuile>
    );
  }
  const cetteSemaine = stats?.volumes.at(-1)?.seances ?? 0;
  const tenues = stats ? semainesTenues(stats.volumes.slice(-SEMAINES_GRAPHIQUE), objectif) : null;
  return (
    <Tuile
      titre="Objectif de la semaine"
      valeur={
        <>
          {cetteSemaine}
          <span className="text-2xl text-muted-foreground"> / {objectif}</span>
        </>
      }
    >
      <div className="flex w-full flex-col gap-2">
        <span className="h-1.5 overflow-hidden rounded-full bg-muted">
          <span
            className="block h-full rounded-full bg-primary"
            style={{ width: `${Math.min(100, (cetteSemaine / objectif) * 100)}%` }}
          />
        </span>
        <span className="flex items-center justify-between gap-2">
          {tenues && tenues.sur > 0
            ? `tenu ${tenues.tenues} des ${tenues.sur} dernières sem.`
            : "pas encore de semaine"}
          {regler("Modifier")}
        </span>
      </div>
    </Tuile>
  );
}

/** L'écart à la période d'avant ; rien sans point de comparaison. */
function tendance(valeur: number, precedent: number, enPourcent: boolean) {
  if (precedent === 0) return null;
  return { texte: ecart(valeur, precedent, enPourcent), hausse: valeur > precedent };
}

// D185 : la comparaison se fait au même moment de la période d'avant.
const avant = (precedent: number, texte: string) =>
  precedent === 0 ? "rien au même moment avant" : `contre ${texte} au même moment avant`;

function Tuile({
  titre,
  valeur,
  tendance,
  children,
}: {
  titre: string;
  valeur: ReactNode;
  tendance?: { texte: string; hausse: boolean } | null;
  children: ReactNode;
}) {
  return (
    <Card className="gap-3 lg:col-span-3">
      <CardHeader>
        <CardDescription>{titre}</CardDescription>
        <p className="chiffre text-[40px]">{valeur}</p>
        {tendance ? (
          <CardAction>
            {/* Un contour sans couleur (D192) : la flèche et le signe disent le sens. */}
            <Badge variant="outline">{tendance.texte}</Badge>
          </CardAction>
        ) : null}
      </CardHeader>
      <CardFooter>{children}</CardFooter>
    </Card>
  );
}
