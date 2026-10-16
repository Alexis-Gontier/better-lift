import { createFileRoute } from "@tanstack/react-router";
import { RoutineEditor } from "@/features/routines/routine-editor";
import { routineById } from "@/mocks/routines";

export const Route = createFileRoute("/_app/routines/$id_/edit")({
  staticData: { crumb: "Modifier" },
  component: EditRoutinePage,
});

function EditRoutinePage() {
  const { id } = Route.useParams();
  // Inconnue : l'éditeur part d'une routine vide, comme une création.
  return <RoutineEditor key={id} routine={routineById(id)} />;
}
