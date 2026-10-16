import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Page } from "@/components/page";
import { useProto } from "@/components/proto/use-proto";
import { StateError } from "@/components/states/state-error";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@/components/ui/empty";
import { Skeleton } from "@/components/ui/skeleton";
import { SessionDetailView } from "@/features/history/session-detail";
import { previousOf, sessionDetail } from "@/mocks/history";
import { mockSessions } from "@/mocks/sessions";

export const Route = createFileRoute("/_app/history/$id")({
  staticData: { crumb: "Détail" },
  component: SessionPage,
});

function DeleteButton() {
  const navigate = useNavigate();
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="outline">Supprimer</Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Supprimer cette séance ?</AlertDialogTitle>
          <AlertDialogDescription>
            Ses séries et les records qu'elle portait disparaîtront. C'est définitif.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Annuler</AlertDialogCancel>
          <AlertDialogAction variant="destructive" onClick={() => navigate({ to: "/history" })}>
            Supprimer
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

function SessionPage() {
  const { id } = Route.useParams();
  const { state } = useProto();
  const session = mockSessions.find((s) => s.id === id);

  if (!session || state === "vide") {
    return (
      <Page title="Séance introuvable">
        <Empty className="border border-dashed">
          <EmptyHeader>
            <EmptyTitle>Cette séance n'existe pas</EmptyTitle>
            <EmptyDescription>Elle a peut-être été supprimée.</EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Button variant="outline" asChild>
              <Link to="/history">Retour à l'historique</Link>
            </Button>
          </EmptyContent>
        </Empty>
      </Page>
    );
  }

  const previous = previousOf(mockSessions, id);
  return (
    <Page title={session.routine} actions={<DeleteButton />}>
      {state === "chargement" && (
        <>
          <Skeleton className="h-48 rounded-xl" />
          <Skeleton className="h-64 rounded-xl" />
        </>
      )}
      {state === "erreur" && <StateError title="La séance n'a pas pu se charger" />}
      {state === "nominal" && (
        <SessionDetailView
          detail={sessionDetail(session)}
          previous={previous ? sessionDetail(previous) : undefined}
        />
      )}
    </Page>
  );
}
