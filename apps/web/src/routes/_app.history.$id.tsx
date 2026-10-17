import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { DetailEmpty, DetailHeader, DetailSkeleton } from "@/components/list-detail";
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
import { SessionDetailView } from "@/features/history/session-detail";
import { formatDay } from "@/lib/format";
import { previousOf, sessionDetail } from "@/mocks/history";
import { mockRoutines } from "@/mocks/routines";
import { mockSessions } from "@/mocks/sessions";

export const Route = createFileRoute("/_app/history/$id")({
  staticData: { crumb: "Détail" },
  component: SessionPane,
});

/** Sans API, supprimer referme simplement la séance. */
function DeleteButton() {
  const navigate = useNavigate();
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="outline" size="sm">
          Supprimer
        </Button>
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
          <AlertDialogAction
            variant="destructive"
            onClick={() => navigate({ to: "/history", search: true })}
          >
            Supprimer
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

/** La séance ouverte, dans le panneau de droite (D235). */
function SessionPane() {
  const { id } = Route.useParams();
  const { state } = useProto();
  const session = mockSessions.find((s) => s.id === id);

  if (state === "chargement") return <DetailSkeleton />;
  if (state === "erreur") return <StateError title="La séance n'a pas pu se charger" />;
  if (!session || state === "vide")
    return (
      <DetailEmpty
        title="Cette séance n'existe pas"
        description="Elle a peut-être été supprimée."
      />
    );

  const previous = previousOf(mockSessions, id);
  const routine = mockRoutines.find((r) => r.name === session.routine);
  return (
    <>
      <DetailHeader
        title={session.routine}
        subtitle={formatDay(session.date)}
        actions={
          <>
            {routine && (
              <Button variant="outline" size="sm" asChild>
                <Link to="/routines/$id" params={{ id: routine.id }}>
                  Voir la routine
                </Link>
              </Button>
            )}
            <DeleteButton />
          </>
        }
      />
      <SessionDetailView
        detail={sessionDetail(session)}
        previous={previous ? sessionDetail(previous) : undefined}
      />
    </>
  );
}
