import { Stack } from "expo-router";
import { couleurs } from "../../../lib/theme";

/** La fiche s'empile dans l'onglet : le retour ramène à la recherche, filtre intact. */
export default function PileExercices() {
  return (
    <Stack
      screenOptions={{ headerShown: false, contentStyle: { backgroundColor: couleurs.canvas } }}
    />
  );
}
