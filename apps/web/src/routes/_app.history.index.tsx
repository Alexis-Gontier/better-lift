import { createFileRoute, Link } from "@tanstack/react-router";
import { ListDetail } from "@/components/list-detail";
import { Page } from "@/components/page";
import { useProto } from "@/components/proto/use-proto";
import { StateError } from "@/components/states/state-error";
import { Button } from "@/components/ui/button";
import { SessionDetailView } from "@/features/history/session-detail";
import {
  SessionList,
  SessionListEmpty,
  SessionListSkeleton,
} from "@/features/history/session-list";
import { formatDay } from "@/lib/format";
import { previousOf, sessionDetail } from "@/mocks/history";
import { mockSessions } from "@/mocks/sessions";

export const Route = createFileRoute("/_app/history/")({
  component: HistoryPage,
});

/** A : séance sur sa page. B : liste | détail redimensionnable. C : séance en panneau latéral. */
function HistoryPage() {
  const { state, variant } = useProto();
  return (
    <Page title="Historique">
      {state === "chargement" && <SessionListSkeleton />}
      {state === "erreur" && <StateError title="L'historique n'a pas pu se charger" />}
      {state === "vide" && <SessionListEmpty />}
      {state === "nominal" && (
        <ListDetail
          key={variant}
          variant={variant}
          storageId="historique"
          defaultSelected={mockSessions[0]?.id ?? null}
          detail={(id) => {
            const session = mockSessions.find((s) => s.id === id);
            if (!session) return null;
            const previous = previousOf(mockSessions, id);
            return {
              title: session.routine,
              subtitle: formatDay(session.date),
              href: (
                <Button variant="outline" size="sm" asChild>
                  <Link to="/history/$id" params={{ id }}>
                    Ouvrir la séance
                  </Link>
                </Button>
              ),
              body: (
                <SessionDetailView
                  detail={sessionDetail(session)}
                  previous={previous ? sessionDetail(previous) : undefined}
                />
              ),
            };
          }}
        >
          <SessionList sessions={mockSessions} />
        </ListDetail>
      )}
    </Page>
  );
}
