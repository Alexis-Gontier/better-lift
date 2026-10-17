import { createFileRoute, Link } from "@tanstack/react-router";
import { DetailEmpty, DetailHeader, DetailSkeleton } from "@/components/list-detail";
import { useProto } from "@/components/proto/use-proto";
import { StateError } from "@/components/states/state-error";
import { Button } from "@/components/ui/button";
import { RoutineDetail } from "@/features/routines/routine-detail";
import { routineById } from "@/mocks/routines";

export const Route = createFileRoute("/_app/routines/$id")({
  staticData: { crumb: "Détail" },
  component: RoutinePane,
});

/** La routine ouverte, dans le panneau de droite (D235). */
function RoutinePane() {
  const { id } = Route.useParams();
  const { state } = useProto();
  const routine = routineById(id);

  if (state === "chargement") return <DetailSkeleton />;
  if (state === "erreur") return <StateError title="La routine n'a pas pu se charger" />;
  if (!routine || state === "vide")
    return (
      <DetailEmpty
        title="Cette routine n'existe pas"
        description="Elle a peut-être été supprimée."
      />
    );

  return (
    <>
      <DetailHeader
        title={routine.name}
        subtitle={routine.folder}
        actions={
          <>
            <Button variant="outline" size="sm">
              Dupliquer
            </Button>
            <Button variant="outline" size="sm" asChild>
              <Link to="/planning">Planifier</Link>
            </Button>
          </>
        }
      />
      <RoutineDetail routine={routine} />
    </>
  );
}
