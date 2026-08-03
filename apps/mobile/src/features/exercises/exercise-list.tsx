import { Link } from "expo-router";
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from "react-native";

import { type ExerciseSummary } from "@better-lift/validators";

import { ExerciseFilters } from "./exercise-filters";
import { ExerciseThumb } from "./exercise-thumb";
import { BODY_PART_LABELS, equipmentLabel } from "./labels";
import { useExerciseSearch } from "./use-exercise-search";

function ExerciseRow({ exercise }: { exercise: ExerciseSummary }) {
  return (
    <Link href={`/exercise/${exercise.id}`} asChild>
      <Pressable style={styles.row}>
        <ExerciseThumb exercise={exercise} />

        <View style={styles.rowText}>
          <Text style={styles.rowTitle} numberOfLines={1}>
            {exercise.name}
          </Text>
          <Text style={styles.rowMeta} numberOfLines={1}>
            {/*
              La provenance est dite sur la ligne : dans une liste qui mêle les
              deux, un exercice personnalisé et son homonyme du catalogue
              seraient sinon indiscernables.
            */}
            {exercise.isCustom ? "Personnalisé · " : ""}
            {BODY_PART_LABELS[exercise.bodyPart]} · {equipmentLabel(exercise.equipment)}
          </Text>
        </View>
      </Pressable>
    </Link>
  );
}

/**
 * Catalogue d'exercices (doc 06, § Exercices).
 *
 * L'écran ne porte que la navigation vers la fiche : la recherche, les filtres
 * et la pagination vivent dans `useExerciseSearch`, partagés avec le sélecteur
 * de séance.
 *
 * `FlatList` et non `FlashList` (doc 06) : la liste est paginée par curseur, on
 * ne monte donc jamais 1 324 lignes d'un coup. `FlashList` est un module natif
 * de plus à embarquer, et le development build n'est pas encore éprouvé sur
 * appareil — il sera temps quand la mesure le justifiera.
 */
export function ExerciseList() {
  const { exercises, items, attributions, filters, unfiltered } = useExerciseSearch();

  return (
    <View style={styles.screen}>
      <ExerciseFilters filters={filters} />

      <FlatList
        data={items}
        keyExtractor={(exercise) => exercise.id}
        renderItem={({ item }) => <ExerciseRow exercise={item} />}
        contentContainerStyle={styles.list}
        keyboardShouldPersistTaps="handled"
        // Assez tôt pour que la page suivante arrive avant le bas de la liste,
        // assez tard pour ne pas la demander dès l'affichage.
        onEndReachedThreshold={0.5}
        onEndReached={() => {
          if (exercises.hasNextPage && !exercises.isFetchingNextPage) {
            void exercises.fetchNextPage();
          }
        }}
        ListEmptyComponent={
          exercises.isPending ? (
            <ActivityIndicator color="#7ad6a5" style={styles.spacer} />
          ) : exercises.isError ? (
            <View style={styles.empty}>
              <Text style={styles.emptyTitle}>Catalogue indisponible</Text>
              <Text style={styles.emptyHint}>{exercises.error.message}</Text>
              <Pressable style={styles.retry} onPress={() => void exercises.refetch()}>
                <Text style={styles.retryLabel}>Réessayer</Text>
              </Pressable>
            </View>
          ) : filters.custom === true && unfiltered ? (
            /*
             * « Les miens » sans résultat n'est pas un échec de recherche :
             * c'est le seul moment où l'on sait que rien n'a encore été créé.
             * L'écran propose donc de créer, il ne conseille pas d'élargir.
             */
            <View style={styles.empty}>
              <Text style={styles.emptyTitle}>Aucun exercice personnalisé</Text>
              <Text style={styles.emptyHint}>
                Utile quand le catalogue ignore un mouvement de votre salle.
              </Text>
              <Link href="/exercise/new" asChild>
                <Pressable style={styles.retry} accessibilityRole="button">
                  <Text style={styles.retryLabel}>Créer un exercice</Text>
                </Pressable>
              </Link>
            </View>
          ) : (
            <View style={styles.empty}>
              <Text style={styles.emptyTitle}>Aucun exercice ne correspond</Text>
              <Text style={styles.emptyHint}>Essayer avec moins de filtres.</Text>
            </View>
          )
        }
        ListFooterComponent={
          <View>
            {exercises.isFetchingNextPage && (
              <ActivityIndicator color="#7ad6a5" style={styles.spacer} />
            )}
            {attributions.map((attribution) => (
              <Text key={attribution} style={styles.attribution}>
                {attribution}
              </Text>
            ))}
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  list: { padding: 16, gap: 8 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "#1a1f25",
    borderRadius: 12,
    padding: 10,
  },
  rowText: { flex: 1 },
  rowTitle: { color: "#f2f4f6", fontSize: 15, fontWeight: "500" },
  rowMeta: { color: "#9aa3ad", fontSize: 13, marginTop: 2 },
  empty: { padding: 24, gap: 8, alignItems: "center" },
  emptyTitle: { color: "#f2f4f6", fontWeight: "600" },
  emptyHint: { color: "#9aa3ad", fontSize: 13, textAlign: "center" },
  retry: {
    marginTop: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#2a323b",
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  retryLabel: { color: "#f2f4f6" },
  spacer: { paddingVertical: 24 },
  attribution: { color: "#6d7680", fontSize: 11, paddingTop: 12, textAlign: "center" },
});
