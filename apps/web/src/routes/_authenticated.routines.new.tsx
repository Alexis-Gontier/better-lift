import { createFileRoute } from "@tanstack/react-router";
import { useCreateRoutine } from "@/features/routines/queries";
import { RoutineEditor } from "@/features/routines/routine-editor";

/**
 * Une routine neuve (D81). Le segment statique `new` l'emporte sur `$id` :
 * aucun identifiant réservé à vérifier à la main.
 */
export const Route = createFileRoute("/_authenticated/routines/new")({
  component: NewRoutinePage,
});

function NewRoutinePage() {
  const navigate = Route.useNavigate();
  const create = useCreateRoutine();

  return (
    <RoutineEditor
      initial={null}
      saving={create.isPending}
      erreur={create.error?.message}
      onSave={(r) =>
        create.mutate(r, {
          // Enregistrée, elle a un identifiant : on passe sur sa vraie page.
          onSuccess: (id) => navigate({ to: "/routines/$id", params: { id }, replace: true }),
        })
      }
      onClose={() => navigate({ to: "/routines" })}
    />
  );
}
