import { createFileRoute, Outlet } from "@tanstack/react-router";
import { ListDetailPage } from "@/components/list-detail";
import { StateError } from "@/components/states/state-error";
import { useEtat } from "@/components/states/use-etat";
import {
  ExerciseList,
  ExerciseListEmpty,
  ExerciseListSkeleton,
} from "@/features/exercises/exercise-list";
import { useExercises } from "@/mocks/exercise-store";

export const Route = createFileRoute("/_app/exercises")({
  staticData: { crumb: "Exercices" },
  component: ExercisesPage,
});

/**
 * La liste reste montée ; la fiche ouverte est la route enfant (D235). Le catalogue seul : pas
 * d'exercice personnel, donc ni onglets ni création (D286).
 */
function ExercisesPage() {
  // Tant que la page lit la maquette : nominal, sauf état forcé par l'URL.
  const state = useEtat() ?? "nominal";
  const exercises = useExercises();
  return (
    <ListDetailPage
      key={state}
      title="Exercices"
      storageId="exercices"
      // La fiche et sa colonne de droite défilent chacune de leur côté (D264).
      detailScroll="columns"
      detail={<Outlet />}
    >
      {state === "chargement" && <ExerciseListSkeleton />}
      {state === "erreur" && <StateError title="Les exercices n'ont pas pu se charger" />}
      {state === "vide" && <ExerciseListEmpty />}
      {state === "nominal" && <ExerciseList exercises={exercises} />}
    </ListDetailPage>
  );
}
