import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { EtatChargement } from "@/components/etats/etat-chargement";
import { EtatErreur } from "@/components/etats/etat-erreur";
import { champEtat, estVideForce, etatForceRendu } from "@/components/etats/etat-force";
import { AppShell } from "@/components/shell/app-shell";
import { DetailSeance } from "@/features/seances/detail-seance";
import { ListeSeances } from "@/features/seances/liste-seances";
import { optionsSeance, optionsSeances } from "@/features/seances/requetes";

const recherche = z.object({ id: z.string().optional(), etat: champEtat });

export const Route = createFileRoute("/_protege/seances")({
  validateSearch: recherche,
  component: PageSeances,
});

function PageSeances() {
  const { id, etat } = Route.useSearch();
  const navigate = Route.useNavigate();
  const liste = useInfiniteQuery(optionsSeances());
  const detail = useQuery({ ...optionsSeance(id ?? ""), enabled: Boolean(id) });

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
        onSelection={(sId) => navigate({ search: (s) => ({ ...s, id: sId }) })}
      />
    );
  }

  function panneauDetail() {
    if (!id) return undefined;
    if (detail.isPending) return <EtatChargement lignes={6} />;
    if (detail.isError) {
      return (
        <EtatErreur
          message="Cette séance n'a pas pu être chargée."
          onReessayer={() => detail.refetch()}
        />
      );
    }
    return (
      <DetailSeance
        seance={detail.data}
        onFermer={() => navigate({ search: (s) => ({ ...s, id: undefined }) })}
      />
    );
  }

  return <AppShell liste={panneauListe()} detail={panneauDetail()} />;
}
