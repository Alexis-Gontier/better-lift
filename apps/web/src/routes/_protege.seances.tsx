import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { champEtat, estVideForce, etatForceRendu } from "@/components/etats/etat-force";
import { AppShell } from "@/components/shell/app-shell";
import { DetailSeance } from "@/features/seances/detail-seance";
import { ListeSeances } from "@/features/seances/liste-seances";
import { SEANCES } from "@/mocks/seances";

const recherche = z.object({ id: z.string().optional(), etat: champEtat });

export const Route = createFileRoute("/_protege/seances")({
  validateSearch: recherche,
  component: PageSeances,
});

function PageSeances() {
  const { id, etat } = Route.useSearch();
  const navigate = Route.useNavigate();

  const visibles = estVideForce(etat) ? [] : SEANCES;
  const selectionnee = id ? visibles.find((s) => s.id === id) : undefined;

  return (
    <AppShell
      liste={
        etatForceRendu(etat, "L'historique n'a pas pu être chargé.", () =>
          navigate({ search: (s) => ({ ...s, etat: undefined }) }),
        ) ?? (
          <ListeSeances
            seances={visibles}
            idSelectionne={id}
            onSelection={(sId) => navigate({ search: (s) => ({ ...s, id: sId }) })}
          />
        )
      }
      detail={
        selectionnee ? (
          <DetailSeance
            seance={selectionnee}
            onFermer={() => navigate({ search: (s) => ({ ...s, id: undefined }) })}
          />
        ) : undefined
      }
    />
  );
}
