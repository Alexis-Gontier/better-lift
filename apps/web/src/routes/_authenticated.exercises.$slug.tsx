import { PERIODES_EXERCICE } from "@better-lift/shared";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { ErrorState } from "@/components/states/error-state";
import { renderForcedState, stateField } from "@/components/states/forced-state";
import { LoadingState } from "@/components/states/loading-state";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ExercisePage } from "@/features/exercises/exercise-page";
import { exerciseOptions, historyOptions, variantsOptions } from "@/features/exercises/queries";

// La période de l'analyse vit dans l'URL (D202) ; 3 mois par défaut. Les filtres de la
// grille passent aussi par cette URL, sans être lus ici : le retour les rend à la grille.
const search = z
  .object({
    period: z.enum(PERIODES_EXERCICE).optional().catch(undefined),
    state: stateField,
  })
  .passthrough();

/**
 * La fiche d'un exercice, dans le panneau de droite (D206) : une route ENFANT de la grille,
 * rendue par son `Outlet`.
 * Le slug est l'identifiant stable et lisible du catalogue : `/exercises/barbell-bench-press`.
 */
export const Route = createFileRoute("/_authenticated/exercises/$slug")({
  validateSearch: search,
  component: ExerciseRoute,
});

function ExerciseRoute() {
  const { slug } = Route.useParams();
  const { period = "3m", state } = Route.useSearch();
  const navigate = Route.useNavigate();
  const detail = useQuery(exerciseOptions(slug));
  const history = useQuery(historyOptions(slug));
  const variants = useQuery(variantsOptions(slug));

  function content() {
    const forced = renderForcedState(state, "Cet exercice n'a pas pu être chargé.", () =>
      navigate({ search: (s) => ({ ...s, state: undefined }) }),
    );
    if (forced) return forced;
    if (detail.isPending) return <LoadingState />;
    if (detail.isError) {
      return (
        <ErrorState
          message="Cet exercice n'a pas pu être chargé."
          onRetry={() => detail.refetch()}
        />
      );
    }
    return (
      <ExercisePage
        exercise={detail.data}
        history={history.isError ? null : history.data}
        variants={variants.isError ? null : variants.data}
        period={period}
        onClose={() =>
          navigate({ to: "/exercises", search: ({ period: _p, state: _s, ...s }) => s })
        }
        onPeriod={(p) =>
          navigate({ search: (s) => ({ ...s, period: p === "3m" ? undefined : p }), replace: true })
        }
      />
    );
  }

  return (
    <ScrollArea className="h-full">
      <div className="px-6 py-5">{content()}</div>
    </ScrollArea>
  );
}
