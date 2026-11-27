import { createFileRoute } from "@tanstack/react-router";
import { seanceQuery } from "@/features/history/queries";
import { SessionPane } from "@/features/history/session-pane";

export const Route = createFileRoute("/_app/history/$id")({
  staticData: { crumb: "Détail" },
  // Sans attendre : le panneau montre son squelette pendant ce temps.
  loader: ({ context, params }) => void context.queryClient.prefetchQuery(seanceQuery(params.id)),
  component: SessionRoute,
});

/** La séance ouverte, dans le panneau de droite, en lecture. */
function SessionRoute() {
  const { id } = Route.useParams();
  return <SessionPane key={id} id={id} />;
}
