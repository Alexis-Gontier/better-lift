import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Outlet, useParams } from "@tanstack/react-router";
import { z } from "zod";
import { EtatChargement } from "@/components/etats/etat-chargement";
import { EtatErreur } from "@/components/etats/etat-erreur";
import { champEtat, estVideForce, etatForceRendu } from "@/components/etats/etat-force";
import { PageListeDetail } from "@/components/shell/page-liste-detail";
import { ListeRoutines } from "@/features/routines/liste-routines";
import { optionsRoutines, useOrdonnerRoutines } from "@/features/routines/requetes";
import { plier } from "@/lib/texte";

// La routine ouverte vit dans le CHEMIN (`/routines/$id`, `/routines/nouvelle`,
// D81). Plus de paramètre `edition` : une routine ouverte est toujours modifiable.
const recherche = z.object({ q: z.string().optional().catch(undefined), etat: champEtat });

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
  const { q = "", etat } = Route.useSearch();
  const { id } = useParams({ strict: false });
  const navigate = Route.useNavigate();
  const liste = useQuery(optionsRoutines());
  const ordonner = useOrdonnerRoutines();

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
    const toutes = estVideForce(etat) ? [] : liste.data;
    const cherche = plier(q.trim());
    return (
      <ListeRoutines
        routines={cherche ? toutes.filter((r) => plier(r.nom).includes(cherche)) : toutes}
        total={toutes.length}
        filtre={q}
        onFiltre={(texte) => {
          // Le filtre garde la routine ouverte : son chemin reste, seul `q` change.
          const search = (s: { q?: string }) => ({ ...s, q: texte || undefined });
          if (id) navigate({ to: "/routines/$id", params: { id }, search, replace: true });
          else navigate({ search, replace: true });
        }}
        idSelectionne={id}
        onSelection={(rId) =>
          navigate({ to: "/routines/$id", params: { id: rId }, search: (s) => s })
        }
        onCreer={() => navigate({ to: "/routines/nouvelle" })}
        onOrdonner={(ids) => ordonner.mutate(ids)}
      />
    );
  }

  return (
    <PageListeDetail
      vers="/routines"
      titre="Routines"
      disposition="colonne"
      liste={panneauListe()}
      detail={<Outlet />}
    />
  );
}
