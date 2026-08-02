import { Stack } from "expo-router";

import { RoutineList } from "@/features/routines/routine-list";

/**
 * Comme le catalogue, les routines vivent dans la pile et non dans un onglet :
 * les cinq onglets de la doc 06 attendent les écrans qu'ils ont à porter —
 * séance, historique. Créer la barre maintenant afficherait des onglets vides.
 */
export default function RoutinesScreen() {
  return (
    <>
      <Stack.Screen options={{ title: "Routines" }} />
      <RoutineList />
    </>
  );
}
