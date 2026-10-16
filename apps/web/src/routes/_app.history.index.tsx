import { createFileRoute } from "@tanstack/react-router";
import { Page } from "@/components/page";
import { useProto } from "@/components/proto/use-proto";
import { StateError } from "@/components/states/state-error";
import {
  SessionList,
  SessionListEmpty,
  SessionListSkeleton,
} from "@/features/history/session-list";
import { mockSessions } from "@/mocks/sessions";

export const Route = createFileRoute("/_app/history/")({
  component: HistoryPage,
});

function HistoryPage() {
  const { state } = useProto();
  return (
    <Page title="Historique">
      {state === "chargement" && <SessionListSkeleton />}
      {state === "erreur" && <StateError title="L'historique n'a pas pu se charger" />}
      {state === "vide" && <SessionListEmpty />}
      {state === "nominal" && <SessionList sessions={mockSessions} />}
    </Page>
  );
}
