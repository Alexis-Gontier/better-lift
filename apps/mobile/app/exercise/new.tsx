import { Stack } from "expo-router";

import { ExerciseForm } from "@/features/exercises/exercise-form";

/**
 * Route statique, donc prioritaire sur `[id].tsx` : `/exercise/new` ne sera
 * jamais lu comme un identifiant d'exercice.
 */
export default function NewExerciseScreen() {
  return (
    <>
      <Stack.Screen options={{ title: "Nouvel exercice" }} />
      <ExerciseForm />
    </>
  );
}
