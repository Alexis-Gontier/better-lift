import { Stack } from "expo-router";

import { ExerciseList } from "@/features/exercises/exercise-list";

/**
 * Le catalogue vit pour l'instant dans la pile, pas dans un onglet : les cinq
 * onglets de la doc 06 attendent les écrans qu'ils ont à porter — routines,
 * historique, séance. Créer la barre maintenant reviendrait à afficher trois
 * onglets vides.
 */
export default function ExercisesScreen() {
  return (
    <>
      <Stack.Screen options={{ title: "Exercices" }} />
      <ExerciseList />
    </>
  );
}
