import { createFileRoute, Outlet } from "@tanstack/react-router";
import { ListDetailPage } from "@/components/list-detail";
import { ExerciseList } from "@/features/exercises/exercise-list";
import { catalogueQuery } from "@/lib/catalogue";
import { faitsQuery } from "@/lib/exercices";

export const Route = createFileRoute("/_app/exercises")({
  staticData: { crumb: "Exercices" },
  // Sans attendre : la liste montre son squelette pendant ce temps (D300).
  loader: ({ context }) => {
    void context.queryClient.prefetchInfiniteQuery(catalogueQuery({ q: "" }));
    void context.queryClient.prefetchQuery(faitsQuery());
  },
  component: ExercisesPage,
});

/**
 * La liste reste montée ; la fiche ouverte est la route enfant (D235). Le catalogue seul : pas
 * d'exercice personnel, donc ni onglets ni création (D286).
 */
function ExercisesPage() {
  return (
    <ListDetailPage
      title="Exercices"
      storageId="exercices"
      // La fiche et sa colonne de droite défilent chacune de leur côté (D264).
      detailScroll="columns"
      detail={<Outlet />}
    >
      <ExerciseList />
    </ListDetailPage>
  );
}
