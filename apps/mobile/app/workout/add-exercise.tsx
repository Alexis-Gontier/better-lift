import { Stack } from "expo-router";

import { ExercisePicker } from "@/features/exercises/exercise-picker";
import { useAddExercises } from "@/features/workouts/use-add-exercises";
import { apiClient } from "@/lib/api";

/**
 * Sélecteur d'exercices d'une séance en cours.
 *
 * Présenté en **modale** — déclarée dans le layout, seul endroit où
 * `presentation` est lu au montage de la pile : on ne quitte pas la séance, on
 * pose une feuille par-dessus. Le geste de fermeture est celui d'un choix qu'on
 * renonce à faire, pas d'une navigation en arrière, et la séance reste dessous.
 */
export default function AddExerciseScreen() {
  const { add, pending, error } = useAddExercises(apiClient);

  return (
    <>
      <Stack.Screen options={{ title: "Ajouter un exercice" }} />
      <ExercisePicker
        onConfirm={(exercises) => {
          void add(exercises);
        }}
        pending={pending}
        error={error}
      />
    </>
  );
}
