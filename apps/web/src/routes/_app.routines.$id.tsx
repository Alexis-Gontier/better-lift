import { createFileRoute } from "@tanstack/react-router";
import { DetailEmpty } from "@/components/list-detail";
import { useProto } from "@/components/proto/use-proto";
import { StateError } from "@/components/states/state-error";
import { RoutinePane } from "@/features/routines/routine-pane";
import { RoutinePaneSkeleton } from "@/features/routines/routines-home";
import { useRoutine } from "@/mocks/routine-store";

export const Route = createFileRoute("/_app/routines/$id")({
  staticData: { crumb: "Détail" },
  component: RoutineRoute,
});

/** La routine ouverte, dans le panneau de droite (D235), modifiée là où on la lit (D243). */
function RoutineRoute() {
  const { id } = Route.useParams();
  const { state } = useProto();
  const routine = useRoutine(id);

  if (state === "chargement") return <RoutinePaneSkeleton />;
  if (state === "erreur") return <StateError title="La routine n'a pas pu se charger" />;
  if (!routine || state === "vide")
    return (
      <DetailEmpty
        title="Cette routine n'existe pas"
        description="Elle a peut-être été supprimée."
      />
    );

  // `key` : d'une routine à l'autre, le brouillon repart de zéro.
  return <RoutinePane key={id} routine={routine} />;
}
