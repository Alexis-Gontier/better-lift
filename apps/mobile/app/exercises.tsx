import { Link, Stack } from "expo-router";
import { Pressable, StyleSheet, Text } from "react-native";

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
      <Stack.Screen
        options={{
          title: "Exercices",
          // Dans l'en-tête plutôt qu'en bouton flottant : la liste défile sur
          // toute la hauteur, un flottant masquerait une ligne en permanence.
          headerRight: () => (
            <Link href="/exercise/new" asChild>
              <Pressable accessibilityRole="button" accessibilityLabel="Créer un exercice">
                <Text style={styles.action}>Créer</Text>
              </Pressable>
            </Link>
          ),
        }}
      />
      <ExerciseList />
    </>
  );
}

const styles = StyleSheet.create({
  action: { color: "#7ad6a5", fontSize: 16, fontWeight: "600" },
});
