import { createFileRoute } from "@tanstack/react-router";
import { ExerciseFiche } from "@/features/exercises/exercise-fiche";
import { exerciceQuery, historiqueQuery } from "@/lib/exercices";

export const Route = createFileRoute("/_app/exercises/$slug")({
  staticData: { crumb: "Détail" },
  // Sans attendre : la fiche montre son squelette pendant ce temps (D300).
  loader: ({ context, params }) => {
    void context.queryClient.prefetchQuery(exerciceQuery(params.slug));
    void context.queryClient.prefetchQuery(historiqueQuery(params.slug));
  },
  component: ExerciseRoute,
});

/** La fiche ouverte, dans le panneau de droite (D235), en deux colonnes (D264). */
function ExerciseRoute() {
  const { slug } = Route.useParams();
  return <ExerciseFiche slug={slug} />;
}
