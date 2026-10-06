import { useInfiniteQuery } from "@tanstack/react-query";
import { createFileRoute, Outlet, useParams } from "@tanstack/react-router";
import { useEffect } from "react";
import { z } from "zod";
import { EtatChargement } from "@/components/etats/etat-chargement";
import { EtatErreur } from "@/components/etats/etat-erreur";
import { champEtat, estVideForce, etatForceRendu } from "@/components/etats/etat-force";
import { PageListeDetail } from "@/components/shell/page-liste-detail";
import { ListeSeances } from "@/features/seances/liste-seances";
import { optionsSeances } from "@/features/seances/requetes";

// La séance ouverte vit dans le CHEMIN (`/seances/$id`, D81) ; les paramètres de
// recherche ne portent plus que ce qui filtre ou force un état.
const recherche = z.object({ etat: champEtat });

/**
 * La mise en page des séances : la coquille et la liste. Le détail est la route
 * enfant `$id`, rendue par l'`Outlet` — la liste ne se recharge pas quand on
 * passe d'une séance à l'autre.
 */
export const Route = createFileRoute("/_protege/seances")({
  validateSearch: recherche,
  component: PageSeances,
});

function PageSeances() {
  const { etat } = Route.useSearch();
  const { id } = useParams({ strict: false });
  const navigate = Route.useNavigate();
  const liste = useInfiniteQuery(optionsSeances());
  const ids = liste.data?.pages.flatMap((p) => p.seances.map((x) => x.id)) ?? [];

  // ↑ / ↓ passent d'une séance à l'autre (D140), sauf pendant une saisie.
  useEffect(() => {
    function surTouche(e: KeyboardEvent) {
      if (e.key !== "ArrowDown" && e.key !== "ArrowUp") return;
      const cible = e.target as HTMLElement;
      if (cible.closest("input, textarea, [contenteditable], [role=dialog]")) return;
      const i = id ? ids.indexOf(id) : -1;
      const suivant = ids[e.key === "ArrowDown" ? i + 1 : Math.max(0, i - 1)];
      if (!suivant || suivant === id) return;
      e.preventDefault();
      navigate({ to: "/seances/$id", params: { id: suivant }, search: (s) => s });
    }
    document.addEventListener("keydown", surTouche);
    return () => document.removeEventListener("keydown", surTouche);
  }, [id, ids, navigate]);

  function panneauListe() {
    const force = etatForceRendu(etat, "L'historique n'a pas pu être chargé.", () =>
      navigate({ search: (s) => ({ ...s, etat: undefined }) }),
    );
    if (force) return force;
    if (liste.isPending) return <EtatChargement />;
    if (liste.isError) {
      return (
        <EtatErreur
          message="L'historique n'a pas pu être chargé."
          onReessayer={() => liste.refetch()}
        />
      );
    }
    const vide = estVideForce(etat);
    return (
      <ListeSeances
        seances={vide ? [] : liste.data.pages.flatMap((p) => p.seances)}
        total={vide ? 0 : (liste.data.pages[0]?.total ?? 0)}
        aSuite={!vide && liste.hasNextPage}
        chargeSuite={liste.isFetchingNextPage}
        onSuite={() => liste.fetchNextPage()}
        idSelectionne={id}
        onSelection={(sId) =>
          navigate({ to: "/seances/$id", params: { id: sId }, search: (s) => s })
        }
      />
    );
  }

  // Le panneau de détail n'existe que lorsqu'une séance est ouverte : la coquille
  // change alors son jeu de panneaux (et sa clé de persistance).
  return (
    <PageListeDetail
      titre="Séances"
      disposition="fil"
      liste={panneauListe()}
      detail={id ? <Outlet /> : undefined}
    />
  );
}
