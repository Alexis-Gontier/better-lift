import { createFileRoute, Link } from "@tanstack/react-router";
import { Page } from "@/components/page";
import { useProto } from "@/components/proto/use-proto";
import { StateError } from "@/components/states/state-error";
import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@/components/ui/empty";
import { Skeleton } from "@/components/ui/skeleton";
import { RoutineDetail, RoutineDetailCompact } from "@/features/routines/routine-detail";
import { routineById } from "@/mocks/routines";

export const Route = createFileRoute("/_app/routines/$id")({
  staticData: { crumb: "Détail" },
  component: RoutinePage,
});

function RoutinePage() {
  const { id } = Route.useParams();
  const { state, variant } = useProto();
  const routine = routineById(id);

  if (!routine || state === "vide") {
    return (
      <Page title="Routine introuvable">
        <Empty className="border border-dashed">
          <EmptyHeader>
            <EmptyTitle>Cette routine n'existe pas</EmptyTitle>
            <EmptyDescription>Elle a peut-être été supprimée.</EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Button variant="outline" asChild>
              <Link to="/routines">Retour aux routines</Link>
            </Button>
          </EmptyContent>
        </Empty>
      </Page>
    );
  }

  return (
    <Page
      title={routine.name}
      actions={
        <>
          <Button variant="outline">Dupliquer</Button>
          <Button variant="outline" asChild>
            <Link to="/planning">Planifier</Link>
          </Button>
          <Button asChild>
            <Link to="/routines/$id/edit" params={{ id }}>
              Modifier
            </Link>
          </Button>
        </>
      }
    >
      {state === "chargement" && (
        <>
          <Skeleton className="h-36 rounded-xl" />
          <Skeleton className="h-64 rounded-xl" />
          <Skeleton className="h-64 rounded-xl" />
        </>
      )}
      {state === "erreur" && <StateError title="La routine n'a pas pu se charger" />}
      {/* A : une carte par exercice. B : un tableau compact. */}
      {state === "nominal" &&
        (variant === "a" ? (
          <RoutineDetail routine={routine} />
        ) : (
          <RoutineDetailCompact routine={routine} />
        ))}
    </Page>
  );
}
