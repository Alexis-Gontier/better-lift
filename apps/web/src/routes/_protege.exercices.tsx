import { GROUPES } from "@better-lift/shared";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { EtatChargement } from "@/components/etats/etat-chargement";
import { EtatErreur } from "@/components/etats/etat-erreur";
import { champEtat, estVideForce, etatForceRendu } from "@/components/etats/etat-force";
import { AppShell } from "@/components/shell/app-shell";
import { DetailExercice } from "@/features/exercices/detail-exercice";
import { ListeExercices } from "@/features/exercices/liste-exercices";
import { optionsCatalogue, optionsExercice } from "@/features/exercices/requetes";
import { optionsRecords } from "@/features/seances/requetes";

// Le détail ouvert et la recherche vivent dans l'URL, validés par schéma (D19).
// `slug` remplace `id` : c'est l'identifiant stable et lisible du catalogue.
// `.catch(undefined)` évite qu'une URL trafiquée fasse échouer tout l'écran —
// un filtre inconnu s'ignore, il ne casse pas la page.
const recherche = z.object({
  q: z.string().optional(),
  groupe: z.enum(GROUPES).optional().catch(undefined),
  slug: z.string().optional(),
  etat: champEtat,
});

export const Route = createFileRoute("/_protege/exercices")({
  validateSearch: recherche,
  component: PageExercices,
});

function PageExercices() {
  const { q, groupe, slug, etat } = Route.useSearch();
  const navigate = Route.useNavigate();

  const liste = useInfiniteQuery(optionsCatalogue({ q, groupe }));
  const detail = useQuery({ ...optionsExercice(slug ?? ""), enabled: Boolean(slug) });
  const records = useQuery({ ...optionsRecords(slug ?? ""), enabled: Boolean(slug) });

  const abandonner = () => navigate({ search: (s) => ({ ...s, etat: undefined }) });
  const vide = estVideForce(etat);
  const exercices = vide ? [] : (liste.data?.pages.flatMap((p) => p.exercices) ?? []);
  const total = vide ? 0 : (liste.data?.pages[0]?.total ?? 0);

  function panneauListe() {
    // Les états forcés par `?etat=` restent prioritaires, en développement
    // seulement : ils permettent de revoir chargement et erreur à la demande,
    // maintenant que les vrais ne se déclenchent plus qu'au hasard du réseau.
    const force = etatForceRendu(etat, "Le catalogue n'a pas pu être chargé.", abandonner);
    if (force) return force;

    if (liste.isPending) return <EtatChargement />;
    if (liste.isError) {
      return (
        <EtatErreur
          message="Le catalogue n'a pas pu être chargé."
          onReessayer={() => liste.refetch()}
        />
      );
    }

    return (
      <ListeExercices
        exercices={exercices}
        total={total}
        aSuite={!vide && liste.hasNextPage}
        chargeSuite={liste.isFetchingNextPage}
        onSuite={() => liste.fetchNextPage()}
        q={q ?? ""}
        slugSelectionne={slug}
        onRecherche={(valeur) => navigate({ search: (s) => ({ ...s, q: valeur || undefined }) })}
        onSelection={(choisi) => navigate({ search: (s) => ({ ...s, slug: choisi }) })}
      />
    );
  }

  function panneauDetail() {
    if (!slug) return undefined;
    if (detail.isPending) return <EtatChargement />;
    if (detail.isError) {
      return (
        <EtatErreur
          message="Cet exercice n'a pas pu être chargé."
          onReessayer={() => detail.refetch()}
        />
      );
    }
    return (
      <DetailExercice
        records={records.isError ? null : records.data}
        exercice={detail.data}
        onFermer={() => navigate({ search: (s) => ({ ...s, slug: undefined }) })}
      />
    );
  }

  return <AppShell liste={panneauListe()} detail={panneauDetail()} />;
}
