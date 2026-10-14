import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { ErrorState } from "@/components/states/error-state";
import { LoadingState } from "@/components/states/loading-state";
import { routineOptions, useDeleteRoutine, useReplaceRoutine } from "@/features/routines/queries";
import { RoutineEditor } from "@/features/routines/routine-editor";

/** Une routine enregistrée, ouverte et toujours modifiable (D81). */
export const Route = createFileRoute("/_authenticated/routines/$id")({ component: RoutinePage });

function RoutinePage() {
  const { id } = Route.useParams();
  const navigate = Route.useNavigate();
  const detail = useQuery(routineOptions(id));
  const replace = useReplaceRoutine(id);
  const remove = useDeleteRoutine();
  const close = () => navigate({ to: "/routines" });

  if (detail.isPending) return <LoadingState rows={6} />;
  if (detail.isError) {
    return (
      <ErrorState
        message="Cette routine n'a pas pu être chargée."
        onRetry={() => detail.refetch()}
      />
    );
  }
  const routine = detail.data;
  return (
    <RoutineEditor
      // La clé remonte l'éditeur quand on change de routine : sa copie de
      // travail repart de la bonne version.
      key={routine.id}
      initial={routine}
      saving={replace.isPending || remove.isPending}
      erreur={replace.error?.message ?? remove.error?.message}
      onSave={(r) => replace.mutate(r)}
      onClose={close}
      onDelete={() => remove.mutate(routine.id, { onSuccess: close })}
    />
  );
}
