import { Stack } from "expo-router";
import { couleurs } from "../../../lib/theme";

/** Le détail s'empile dans l'onglet : le retour ramène à la liste. */
export default function PileRoutines() {
  return (
    <Stack
      screenOptions={{ headerShown: false, contentStyle: { backgroundColor: couleurs.canvas } }}
    />
  );
}
