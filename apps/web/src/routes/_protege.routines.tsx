import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { champEtat, estVideForce, etatForceRendu } from "@/components/etats/etat-force";
import { AppShell } from "@/components/shell/app-shell";
import { DetailRoutine } from "@/features/routines/detail-routine";
import { ListeRoutines } from "@/features/routines/liste-routines";
import { ROUTINES } from "@/mocks/routines";

const recherche = z.object({ id: z.string().optional(), etat: champEtat });

export const Route = createFileRoute("/_protege/routines")({
  validateSearch: recherche,
  component: PageRoutines,
});

function PageRoutines() {
  const { id, etat } = Route.useSearch();
  const navigate = Route.useNavigate();

  // Les routines factices ne sont jamais vides : sans ce forçage, l'état de
  // premier lancement — le tout premier écran d'un compte neuf — serait le seul
  // des quatre qu'aucune manipulation ne permettrait d'atteindre.
  const visibles = estVideForce(etat) ? [] : ROUTINES;
  const selectionnee = id ? visibles.find((r) => r.id === id) : undefined;

  return (
    <AppShell
      liste={
        etatForceRendu(etat, "Les routines n'ont pas pu être chargées.", () =>
          navigate({ search: (s) => ({ ...s, etat: undefined }) }),
        ) ?? (
          <ListeRoutines
            routines={visibles}
            idSelectionne={id}
            onSelection={(rId) => navigate({ search: (s) => ({ ...s, id: rId }) })}
          />
        )
      }
      detail={
        selectionnee ? (
          <DetailRoutine
            routine={selectionnee}
            onFermer={() => navigate({ search: (s) => ({ ...s, id: undefined }) })}
          />
        ) : undefined
      }
    />
  );
}
