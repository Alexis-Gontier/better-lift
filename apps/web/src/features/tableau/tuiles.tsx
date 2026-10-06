import { type StatsPeriode, semainesTenues } from "@better-lift/shared";
import { Link } from "@tanstack/react-router";
import { cn } from "cn";
import type { ReactNode } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardAction, CardDescription, CardFooter, CardHeader } from "@/components/ui/card";
import { dureeTexte, ecart } from "./calculs";

/** Ligne 1 (D137) : trois chiffres comparés à la période d'avant, puis l'objectif. */
export function Tuiles({ stats, objectif }: { stats: StatsPeriode; objectif: number | null }) {
  const { totaux, precedents } = stats;
  const tenues = objectif ? semainesTenues(stats.volumes, objectif) : null;

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
        titre="Séries"
        valeur={totaux.series}
        tendance={tendance(totaux.series, precedents.series, true)}
      >
        {avant(precedents.series, String(precedents.series))}
      </Tuile>
      <Tuile
        titre="Durée"
        valeur={dureeTexte(totaux.dureeMin)}
        tendance={tendance(totaux.dureeMin, precedents.dureeMin, true)}
      >
        {avant(precedents.dureeMin, dureeTexte(precedents.dureeMin))}
      </Tuile>
      {objectif && tenues ? (
        <Tuile
          titre={`Objectif · ${objectif} / sem.`}
          valeur={
            <>
              {tenues.tenues}
              <span className="text-2xl text-(--ink-muted)"> / {tenues.sur}</span>
            </>
          }
        >
          {tenues.sur > 1 ? "semaines tenues" : "semaine tenue"}
        </Tuile>
      ) : (
        <Tuile titre="Objectif" valeur="—">
          <Link to="/profil" className="underline underline-offset-4 hover:text-(--ink)">
            Fixer un objectif hebdomadaire
          </Link>
        </Tuile>
      )}
    </>
  );
}

/** L'écart à la période d'avant ; rien sans point de comparaison. */
function tendance(valeur: number, precedent: number, enPourcent: boolean) {
  if (precedent === 0) return null;
  return { texte: ecart(valeur, precedent, enPourcent), hausse: valeur > precedent };
}

const avant = (precedent: number, texte: string) =>
  precedent === 0 ? "rien sur la période d'avant" : `contre ${texte} sur la période d'avant`;

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
            {/* Un contour (D158) : lime quand ça monte, neutre sinon. */}
            <Badge
              variant="outline"
              className={cn(tendance.hausse && "border-accent-line bg-accent-wash text-accent-ink")}
            >
              {tendance.texte}
            </Badge>
          </CardAction>
        ) : null}
      </CardHeader>
      <CardFooter>{children}</CardFooter>
    </Card>
  );
}
