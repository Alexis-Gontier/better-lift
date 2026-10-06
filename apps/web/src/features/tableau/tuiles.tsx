import { type StatsPeriode, semainesTenues } from "@better-lift/shared";
import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { dureeTexte, ecart } from "./calculs";
import { Carte } from "./carte";

/** Ligne 1 (D137) : trois chiffres comparés à la période d'avant, puis l'objectif. */
export function Tuiles({ stats, objectif }: { stats: StatsPeriode; objectif: number | null }) {
  const { totaux, precedents } = stats;
  const tenues = objectif ? semainesTenues(stats.volumes, objectif) : null;

  return (
    <>
      <Tuile titre="Séances" valeur={totaux.seances}>
        {ecart(totaux.seances, precedents.seances, false)}
      </Tuile>
      <Tuile titre="Séries" valeur={totaux.series}>
        {ecart(totaux.series, precedents.series, true)}
      </Tuile>
      <Tuile titre="Durée" valeur={dureeTexte(totaux.dureeMin)}>
        {ecart(totaux.dureeMin, precedents.dureeMin, true)}
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

function Tuile({
  titre,
  valeur,
  children,
}: {
  titre: string;
  valeur: ReactNode;
  children: ReactNode;
}) {
  return (
    <Carte titre={titre} className="gap-2 lg:col-span-3">
      <p className="chiffre text-[44px]">{valeur}</p>
      <p className="text-[13px] text-(--ink-muted)">{children}</p>
    </Carte>
  );
}
