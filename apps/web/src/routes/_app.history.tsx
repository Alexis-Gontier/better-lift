import { createFileRoute, Outlet } from "@tanstack/react-router";
import { ListDetailPage } from "@/components/list-detail";
import { StateError } from "@/components/states/state-error";
import { useEtat } from "@/components/states/use-etat";
import {
  SessionList,
  SessionListEmpty,
  SessionListSkeleton,
} from "@/features/history/session-list";
import { useSessions } from "@/mocks/session-store";

export const Route = createFileRoute("/_app/history")({
  staticData: { crumb: "Historique" },
  component: HistoryPage,
});

/** La liste reste montée ; la séance ouverte est la route enfant (D235). */
function HistoryPage() {
  // Tant que la page lit la maquette : nominal, sauf état forcé par l'URL.
  const state = useEtat() ?? "nominal";
  const sessions = useSessions();
  return (
    <ListDetailPage key={state} title="Historique" storageId="historique" detail={<Outlet />}>
      {state === "chargement" && <SessionListSkeleton />}
      {state === "erreur" && <StateError title="L'historique n'a pas pu se charger" />}
      {state === "vide" && <SessionListEmpty />}
      {state === "nominal" && <SessionList sessions={sessions} />}
    </ListDetailPage>
  );
}
