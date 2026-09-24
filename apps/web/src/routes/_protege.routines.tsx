import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Outlet, useParams } from "@tanstack/react-router";
import { z } from "zod";
import { EtatChargement } from "@/components/etats/etat-chargement";
import { EtatErreur } from "@/components/etats/etat-erreur";
import { champEtat, estVideForce, etatForceRendu } from "@/components/etats/etat-force";
import { AppShell } from "@/components/shell/app-shell";
import { ListeRoutines } from "@/features/routines/liste-routines";
import { optionsRoutines } from "@/features/routines/requetes";

// La routine ouverte vit dans le CHEMIN (`/routines/$id`, `/routines/nouvelle`,
// D81). Plus de paramètre `edition` : une routine ouverte est toujours modifiable.
const recherche = z.object({ etat: champEtat });

/**
 * La mise en page des routines, en disposition `colonne` : la colonne de
 * sélection à gauche, l'espace de travail à droite — l'`Outlet`, toujours
 * présent (invite, éditeur, ou routine neuve selon la route enfant).
 */
export const Route = createFileRoute("/_protege/routines")({
  validateSearch: recherche,
  component: PageRoutines,
});

function PageRoutines() {
  const { etat } = Route.useSearch();
  const { id } = useParams({ strict: false });
  const navigate = Route.useNavigate();
  const liste = useQuery(optionsRoutines());

  function panneauListe() {
    const force = etatForceRendu(etat, "Les routines n'ont pas pu être chargées.", () =>
      navigate({ search: (s) => ({ ...s, etat: undefined }) }),
    );
    if (force) return force;
    if (liste.isPending) return <EtatChargement />;
    if (liste.isError) {
      return (
        <EtatErreur
          message="Les routines n'ont pas pu être chargées."
          onReessayer={() => liste.refetch()}
        />
      );
    }
    return (
      <ListeRoutines
        routines={estVideForce(etat) ? [] : liste.data}
        idSelectionne={id}
        onSelection={(rId) => navigate({ to: "/routines/$id", params: { id: rId } })}
        onCreer={() => navigate({ to: "/routines/nouvelle" })}
      />
    );
  }

  return (
    <AppShell titre="Routines" disposition="colonne" liste={panneauListe()} detail={<Outlet />} />
  );
}
