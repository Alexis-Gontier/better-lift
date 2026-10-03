import { Stack } from "expo-router";
import { useCouleurs } from "../../../lib/theme";

/** La fiche s'empile dans l'onglet : le retour ramène à la recherche, filtre intact. */
export default function PileExercices() {
  const couleurs = useCouleurs();
  return (
    <Stack
      screenOptions={{ headerShown: false, contentStyle: { backgroundColor: couleurs.canevas } }}
    />
  );
}
