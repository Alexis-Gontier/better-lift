import { createFileRoute, Link } from "@tanstack/react-router";
import { ListDetailPage } from "@/components/list-detail";
import { useProto } from "@/components/proto/use-proto";
import { StateError } from "@/components/states/state-error";
import { Button } from "@/components/ui/button";
import { RoutineDetail } from "@/features/routines/routine-detail";
import {
  RoutineList,
  RoutineListEmpty,
  RoutineListSkeleton,
} from "@/features/routines/routine-list";
import { mockRoutines, routineById } from "@/mocks/routines";

export const Route = createFileRoute("/_app/routines/")({
  component: RoutinesPage,
});

/** Liste | détail sur toute la page (variante B retenue, D234). */
function RoutinesPage() {
  const { state } = useProto();
  return (
    <ListDetailPage
      key={state}
      title="Routines"
      actions={
        <Button asChild>
          <Link to="/routines/new">Nouvelle routine</Link>
        </Button>
      }
      storageId="routines"
      defaultSelected={state === "nominal" ? (mockRoutines[0]?.id ?? null) : null}
      detail={(id) => {
        const routine = routineById(id);
        if (!routine) return null;
        return {
          title: routine.name,
          subtitle: routine.folder,
          href: (
            <Button variant="outline" size="sm" asChild>
              <Link to="/routines/$id/edit" params={{ id }}>
                Modifier
              </Link>
            </Button>
          ),
          body: <RoutineDetail routine={routine} />,
        };
      }}
    >
      {state === "chargement" && <RoutineListSkeleton />}
      {state === "erreur" && <StateError title="Les routines n'ont pas pu se charger" />}
      {state === "vide" && <RoutineListEmpty />}
      {state === "nominal" && <RoutineList routines={mockRoutines} />}
    </ListDetailPage>
  );
}
