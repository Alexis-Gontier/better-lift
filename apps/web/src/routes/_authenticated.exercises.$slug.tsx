import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { ErrorState } from "@/components/states/error-state";
import { LoadingState } from "@/components/states/loading-state";
import { ExerciseDetail } from "@/features/exercises/exercise-detail";
import { exerciseOptions, historyOptions } from "@/features/exercises/queries";
import { recordsOptions } from "@/features/sessions/queries";

/**
 * La fiche d'un exercice, dans le panneau de détail (D81). Le slug est
 * l'identifiant stable et lisible du catalogue : `/exercises/barbell-bench-press`.
 */
export const Route = createFileRoute("/_authenticated/exercises/$slug")({
  component: ExercisePage,
});

function ExercisePage() {
  const { slug } = Route.useParams();
  const navigate = Route.useNavigate();
  const detail = useQuery(exerciseOptions(slug));
  const records = useQuery(recordsOptions(slug));
  const history = useQuery(historyOptions(slug));

  if (detail.isPending) return <LoadingState />;
  if (detail.isError) {
    return (
      <ErrorState message="Cet exercice n'a pas pu être chargé." onRetry={() => detail.refetch()} />
    );
  }
  return (
    <ExerciseDetail
      records={records.isError ? null : records.data}
      history={history.isError ? null : history.data}
      exercise={detail.data}
      // Fermer garde les filtres : on retombe sur la liste telle qu'on l'a laissée.
      onClose={() => navigate({ to: "/exercises", search: (s) => s })}
    />
  );
}
