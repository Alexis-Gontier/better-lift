import { createFileRoute } from "@tanstack/react-router";
import { routineQuery, seancesRoutineQuery } from "@/features/routines/queries";
import { RoutinePane } from "@/features/routines/routine-pane";

export const Route = createFileRoute("/_app/routines/$id")({
  staticData: { crumb: "Détail" },
  // Sans attendre : le panneau montre son squelette pendant ce temps (D300).
  loader: ({ context, params }) => {
    void context.queryClient.prefetchQuery(routineQuery(params.id));
    void context.queryClient.prefetchQuery(seancesRoutineQuery(params.id));
  },
  component: RoutineRoute,
});

/** La routine ouverte, dans le panneau de droite (D235), modifiée là où on la lit (D243). */
function RoutineRoute() {
  const { id } = Route.useParams();
  // `key` : d'une routine à l'autre, le brouillon repart de zéro.
  return <RoutinePane key={id} id={id} />;
}
