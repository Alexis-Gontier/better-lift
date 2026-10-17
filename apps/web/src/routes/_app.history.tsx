import { createFileRoute, Outlet } from "@tanstack/react-router";
import { ListDetailPage } from "@/components/list-detail";
import { useProto } from "@/components/proto/use-proto";
import { StateError } from "@/components/states/state-error";
import {
  SessionList,
  SessionListEmpty,
  SessionListSkeleton,
} from "@/features/history/session-list";
import { mockSessions } from "@/mocks/sessions";

export const Route = createFileRoute("/_app/history")({
  staticData: { crumb: "Historique" },
  component: HistoryPage,
});

/** La liste reste montée ; la séance ouverte est la route enfant (D235). */
function HistoryPage() {
  const { state } = useProto();
  return (
    <ListDetailPage key={state} title="Historique" storageId="historique" detail={<Outlet />}>
      {state === "chargement" && <SessionListSkeleton />}
      {state === "erreur" && <StateError title="L'historique n'a pas pu se charger" />}
      {state === "vide" && <SessionListEmpty />}
      {state === "nominal" && <SessionList sessions={mockSessions} />}
    </ListDetailPage>
  );
}
