import { createFileRoute } from "@tanstack/react-router";
import { DetailEmpty, DetailSkeleton } from "@/components/list-detail";
import { useProto } from "@/components/proto/use-proto";
import { StateError } from "@/components/states/state-error";
import {
  RoutinePaneAlwaysEditable,
  RoutinePaneInline,
  RoutinePaneReadThenEdit,
} from "@/features/routines/routine-pane";
import { useRoutine } from "@/mocks/routine-store";

export const Route = createFileRoute("/_app/routines/$id")({
  staticData: { crumb: "Détail" },
  component: RoutinePane,
});

/**
 * La routine ouverte, dans le panneau de droite (D235), modifiée là où on la lit (D238) :
 * A toujours modifiable, B lecture puis Modifier, C champ par champ (D239).
 */
function RoutinePane() {
  const { id } = Route.useParams();
  const { state, variant } = useProto();
  const routine = useRoutine(id);

  if (state === "chargement") return <DetailSkeleton />;
  if (state === "erreur") return <StateError title="La routine n'a pas pu se charger" />;
  if (!routine || state === "vide")
    return (
      <DetailEmpty
        title="Cette routine n'existe pas"
        description="Elle a peut-être été supprimée."
      />
    );

  // `key` : d'une routine à l'autre, le brouillon repart de zéro.
  if (variant === "b") return <RoutinePaneReadThenEdit key={id} routine={routine} />;
  if (variant === "c") return <RoutinePaneInline key={id} routine={routine} />;
  return <RoutinePaneAlwaysEditable key={id} routine={routine} />;
}
