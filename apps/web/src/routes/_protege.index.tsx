import { PERIODES } from "@better-lift/shared";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { EtatErreur } from "@/components/etats/etat-erreur";
import { champEtat, estVideForce, etatForceRendu } from "@/components/etats/etat-force";
import { EtatVide } from "@/components/etats/etat-vide";
import { PageTableau } from "@/components/shell/page-tableau";
import { Skeleton } from "@/components/ui/skeleton";
import { Calendrier } from "@/features/tableau/calendrier";
import { Muscles } from "@/features/tableau/muscles";
import { Records } from "@/features/tableau/records";
import { optionsPreferences, optionsStatsPeriode } from "@/features/tableau/requetes";
import { SelecteurPeriode } from "@/features/tableau/selecteur-periode";
import { Tuiles } from "@/features/tableau/tuiles";
import { Volume } from "@/features/tableau/volume";

// La période vit dans l'URL (D137) : absente, c'est le mois — l'adresse reste `/`.
const recherche = z.object({ periode: z.enum(PERIODES).optional(), etat: champEtat });

// La page d'arrivée (D134), sous la garde de `_protege`.
export const Route = createFileRoute("/_protege/")({
  validateSearch: recherche,
  component: TableauDeBord,
});

const GRILLE = "grid grid-cols-1 gap-3 lg:grid-cols-12";

function TableauDeBord() {
  const { periode = "mois", etat } = Route.useSearch();
  const navigate = Route.useNavigate();
  const stats = useQuery(optionsStatsPeriode(periode));
  // Le calendrier montre toujours l'année (D138) ; en Année, c'est la même requête.
  const annee = useQuery(optionsStatsPeriode("annee"));
  const preferences = useQuery(optionsPreferences());

  function contenu() {
    const force = etatForceRendu(etat, "Les statistiques n'ont pas pu être chargées.", () =>
      navigate({ search: (s) => ({ ...s, etat: undefined }) }),
    );
    if (force) return force;
    if (stats.isPending || annee.isPending) return <Squelette />;
    if (stats.isError || annee.isError) {
      return (
        <EtatErreur
          message="Les statistiques n'ont pas pu être chargées."
          onReessayer={() => {
            stats.refetch();
            annee.refetch();
          }}
        />
      );
    }
    if (estVideForce(etat) || stats.data.nbSeances === 0) {
      return (
        <div className="h-80">
          <EtatVide
            titre="Pas encore de séance."
            message="Les statistiques apparaissent après ta première séance sur le téléphone."
          />
        </div>
      );
    }
    return (
      <div className={GRILLE}>
        {/* Sans préférences lisibles, la tuile invite à fixer l'objectif : rien ne bloque. */}
        <Tuiles stats={stats.data} objectif={preferences.data?.objectifHebdo ?? null} />
        <Calendrier
          annee={annee.data}
          debutPeriode={stats.data.premierLundi}
          onOuvrir={(id) => navigate({ to: "/seances/$id", params: { id } })}
        />
        <Muscles stats={stats.data} />
        <Volume stats={stats.data} />
        <Records records={stats.data.records} />
      </div>
    );
  }

  return (
    <PageTableau
      titre="Tableau de bord"
      actions={
        <SelecteurPeriode
          periode={periode}
          onChange={(p) => navigate({ search: (s) => ({ ...s, periode: p }) })}
        />
      }
    >
      {contenu()}
    </PageTableau>
  );
}

// La forme de la grille, pour que rien ne saute à l'arrivée des données.
const SQUELETTE = [3, 3, 3, 3, 12, 7, 5, 12] as const;
const SPAN: Record<number, string> = {
  3: "lg:col-span-3",
  5: "lg:col-span-5",
  7: "lg:col-span-7",
  12: "lg:col-span-12",
};

function Squelette() {
  return (
    <div className={GRILLE} aria-busy="true">
      <span className="sr-only">Chargement…</span>
      {SQUELETTE.map((n, i) => (
        <Skeleton
          key={i}
          className={`${SPAN[n]} ${n === 3 ? "h-32" : "h-56"} rounded-xl bg-card`}
        />
      ))}
    </div>
  );
}
