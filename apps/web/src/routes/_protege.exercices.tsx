import { GROUPES } from "@better-lift/shared";
import { useInfiniteQuery } from "@tanstack/react-query";
import { createFileRoute, Outlet, useParams } from "@tanstack/react-router";
import { z } from "zod";
import { EtatChargement } from "@/components/etats/etat-chargement";
import { EtatErreur } from "@/components/etats/etat-erreur";
import { champEtat, estVideForce, etatForceRendu } from "@/components/etats/etat-force";
import { AppShell } from "@/components/shell/app-shell";
import { ListeExercices } from "@/features/exercices/liste-exercices";
import { optionsCatalogue } from "@/features/exercices/requetes";

// L'exercice ouvert vit dans le CHEMIN (`/exercices/$slug`, D81) ; la recherche
// et le groupe restent en paramètres : ce sont des filtres, et ils suivent quand
// on passe d'un exercice à l'autre. `.catch(undefined)` évite qu'une URL
// trafiquée fasse échouer tout l'écran — un filtre inconnu s'ignore.
const recherche = z.object({
  q: z.string().optional(),
  groupe: z.enum(GROUPES).optional().catch(undefined),
  etat: champEtat,
});

/**
 * La mise en page du catalogue : la coquille et la liste filtrée. La fiche est
 * la route enfant `$slug`, rendue par l'`Outlet`.
 */
export const Route = createFileRoute("/_protege/exercices")({
  validateSearch: recherche,
  component: PageExercices,
});

function PageExercices() {
  const { q, groupe, etat } = Route.useSearch();
  const { slug } = useParams({ strict: false });
  const navigate = Route.useNavigate();

  const liste = useInfiniteQuery(optionsCatalogue({ q, groupe }));

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
        groupe={groupe}
        slugSelectionne={slug}
        onRecherche={(valeur) => navigate({ search: (s) => ({ ...s, q: valeur || undefined }) })}
        onGroupe={(g) => navigate({ search: (s) => ({ ...s, groupe: g }) })}
        onSelection={(choisi) =>
          navigate({ to: "/exercices/$slug", params: { slug: choisi }, search: (s) => s })
        }
      />
    );
  }

  return (
    <AppShell titre="Exercices" liste={panneauListe()} detail={slug ? <Outlet /> : undefined} />
  );
}
