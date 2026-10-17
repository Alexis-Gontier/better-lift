import { createFileRoute, Link, Outlet } from "@tanstack/react-router";
import { FolderPlus, Plus } from "lucide-react";
import { ListDetailPage } from "@/components/list-detail";
import { useProto } from "@/components/proto/use-proto";
import { StateError } from "@/components/states/state-error";
import { Button } from "@/components/ui/button";
import {
  RoutineList,
  RoutineListEmpty,
  RoutineListSkeleton,
} from "@/features/routines/routine-list";
import { addFolder, useRoutines } from "@/mocks/routine-store";

export const Route = createFileRoute("/_app/routines")({
  staticData: { crumb: "Routines" },
  component: RoutinesPage,
});

/** La liste reste montée ; la routine ouverte est la route enfant (D235). */
function RoutinesPage() {
  const { state } = useProto();
  const routines = useRoutines();
  return (
    <ListDetailPage
      key={state}
      title="Routines"
      footer={
        state === "nominal" && (
          <>
            <Button asChild className="flex-1">
              <Link to="/routines/new" search>
                <Plus data-icon="inline-start" /> Nouvelle routine
              </Link>
            </Button>
            <Button variant="outline" onClick={addFolder}>
              <FolderPlus data-icon="inline-start" /> Dossier
            </Button>
          </>
        )
      }
      storageId="routines"
      // L'éditeur et sa colonne de droite défilent chacun de leur côté (D255).
      detailScroll="columns"
      detail={<Outlet />}
    >
      {state === "chargement" && <RoutineListSkeleton />}
      {state === "erreur" && <StateError title="Les routines n'ont pas pu se charger" />}
      {state === "vide" && <RoutineListEmpty />}
      {state === "nominal" && <RoutineList routines={routines} />}
    </ListDetailPage>
  );
}
