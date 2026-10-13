import { PERIODES } from "@better-lift/shared";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { z } from "zod";
import { EtatErreur } from "@/components/etats/etat-erreur";
import { champEtat, estVideForce, etatForceRendu } from "@/components/etats/etat-force";
import { EtatVide } from "@/components/etats/etat-vide";
import { PageTableau } from "@/components/shell/page-tableau";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { finDePeriode, intervallePeriode } from "@/features/tableau/calculs";
import { Calendrier } from "@/features/tableau/calendrier";
import { DernieresSeances } from "@/features/tableau/dernieres-seances";
import { Muscles } from "@/features/tableau/muscles";
import { Records } from "@/features/tableau/records";
import { optionsPreferences, optionsStatsPeriode } from "@/features/tableau/requetes";
import { SelecteurPeriode } from "@/features/tableau/selecteur-periode";
import { Tuiles } from "@/features/tableau/tuiles";
import { Volume } from "@/features/tableau/volume";

// La période vit dans l'URL (D137) : absente, c'est le mois — l'adresse reste `/`.
const recherche = z.object({
  periode: z.enum(PERIODES).optional(),
  // D190 : combien de périodes en arrière ; absent, la période en cours.
  decalage: z.coerce.number().int().min(0).optional(),
  etat: champEtat,
});

// La page d'arrivée (D134), sous la garde de `_protege`.
export const Route = createFileRoute("/_protege/")({
  validateSearch: recherche,
  component: TableauDeBord,
});

const GRILLE = "grid grid-cols-1 gap-3 lg:grid-cols-12";

function TableauDeBord() {
  const { periode = "mois", decalage = 0, etat } = Route.useSearch();
  const navigate = Route.useNavigate();
  const stats = useQuery(optionsStatsPeriode(periode, decalage));
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
        <div className={GRILLE}>
          <Tuiles stats={null} preferences={preferences.data ?? null} />
          <div className="h-72 lg:col-span-12">
            <EtatVide
              titre="Ta première séance remplira ce tableau."
              message="Crée une routine ici, puis note la séance sur le téléphone."
              action={
                <Button asChild>
                  <Link to="/routines/nouvelle">Créer une routine</Link>
                </Button>
              }
            />
          </div>
        </div>
      );
    }
    return (
      <div className={GRILLE}>
        <Tuiles stats={stats.data} preferences={preferences.data ?? null} decalage={decalage} />
        <Volume stats={stats.data} />
        <Records records={stats.data.records} />
        <Muscles stats={stats.data} />
        <DernieresSeances />
        <Calendrier
          annee={annee.data}
          debutPeriode={stats.data.premierLundi}
          finPeriode={finDePeriode(stats.data.premierLundi, stats.data.nbSemaines)}
          onOuvrir={(id) => navigate({ to: "/seances/$id", params: { id } })}
        />
      </div>
    );
  }

  return (
    <PageTableau
      titre="Tableau de bord"
      actions={
        <SelecteurPeriode
          periode={periode}
          decalage={decalage}
          intervalle={
            stats.data ? intervallePeriode(stats.data.premierLundi, stats.data.nbSemaines) : null
          }
          onChange={(p) => navigate({ search: (s) => ({ ...s, periode: p, decalage: undefined }) })}
          onDecaler={(d) => navigate({ search: (s) => ({ ...s, decalage: d || undefined }) })}
        />
      }
    >
      {contenu()}
    </PageTableau>
  );
}

// La forme de la grille, pour que rien ne saute à l'arrivée des données.
const SQUELETTE = [3, 3, 3, 3, 8, 4, 7, 5, 12] as const;
const SPAN: Record<number, string> = {
  3: "lg:col-span-3",
  4: "lg:col-span-4",
  5: "lg:col-span-5",
  7: "lg:col-span-7",
  8: "lg:col-span-8",
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
