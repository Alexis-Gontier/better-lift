import { Stack, useLocalSearchParams } from "expo-router";

import { RoutinePreview } from "@/features/routines/routine-preview";

export default function RoutineScreen() {
  // `useLocalSearchParams` et non `useGlobalSearchParams` : le second continue
  // de rendre l'écran quand une autre route change de paramètre.
  const { id } = useLocalSearchParams<{ id: string }>();

  return (
    <>
      <Stack.Screen options={{ title: "Routine" }} />
      <RoutinePreview id={id} />
    </>
  );
}
