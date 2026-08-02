import { Stack, useLocalSearchParams } from "expo-router";

import { ExerciseDetail } from "@/features/exercises/exercise-detail";

export default function ExerciseScreen() {
  // `useLocalSearchParams` et non `useGlobalSearchParams` : le second continue
  // de rendre l'écran quand une autre route change de paramètre.
  const { id } = useLocalSearchParams<{ id: string }>();

  return (
    <>
      <Stack.Screen options={{ title: "Exercice" }} />
      <ExerciseDetail id={id} />
    </>
  );
}
