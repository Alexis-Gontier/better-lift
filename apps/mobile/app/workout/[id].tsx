import { Stack, useLocalSearchParams } from "expo-router";

import { WorkoutSummary } from "@/features/workouts/workout-summary";

export default function WorkoutScreen() {
  // `useLocalSearchParams` et non `useGlobalSearchParams` : le second continue
  // de rendre l'écran quand une autre route change de paramètre.
  const { id } = useLocalSearchParams<{ id: string }>();

  return (
    <>
      <Stack.Screen options={{ title: "Séance" }} />
      <WorkoutSummary id={id} />
    </>
  );
}
