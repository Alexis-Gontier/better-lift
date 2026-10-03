import { Stack } from "expo-router";
import { useCouleurs } from "../../../lib/theme";

/** Le détail s'empile dans l'onglet : le retour ramène à la liste. */
export default function PileRoutines() {
  const couleurs = useCouleurs();
  return (
    <Stack
      screenOptions={{ headerShown: false, contentStyle: { backgroundColor: couleurs.canevas } }}
    />
  );
}
