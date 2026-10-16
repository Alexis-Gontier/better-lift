import { createFileRoute, Link } from "@tanstack/react-router";
import { Page } from "@/components/page";
import { useProto } from "@/components/proto/use-proto";
import { StateError } from "@/components/states/state-error";
import { Button } from "@/components/ui/button";
import {
  RoutineList,
  RoutineListEmpty,
  RoutineListSkeleton,
} from "@/features/routines/routine-list";
import { mockRoutines } from "@/mocks/routines";

export const Route = createFileRoute("/_app/routines/")({
  component: RoutinesPage,
});

function RoutinesPage() {
  const { state } = useProto();
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
      {state === "nominal" && <RoutineList routines={mockRoutines} />}
    </Page>
  );
}
