import { createFileRoute, Link } from "@tanstack/react-router";
import { ListDetail } from "@/components/list-detail";
import { Page } from "@/components/page";
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

/** A : détail sur sa page. B : liste | détail redimensionnable. C : détail en panneau latéral. */
function RoutinesPage() {
  const { state, variant } = useProto();
  return (
    <Page
      title="Routines"
      actions={
        <Button asChild>
          <Link to="/routines/new">Nouvelle routine</Link>
        </Button>
      }
    >
      {state === "chargement" && <RoutineListSkeleton />}
      {state === "erreur" && <StateError title="Les routines n'ont pas pu se charger" />}
      {state === "vide" && <RoutineListEmpty />}
      {state === "nominal" && (
        <ListDetail
          key={variant}
          variant={variant}
          storageId="routines"
          defaultSelected={mockRoutines[0]?.id ?? null}
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
          <RoutineList routines={mockRoutines} />
        </ListDetail>
      )}
    </Page>
  );
}
