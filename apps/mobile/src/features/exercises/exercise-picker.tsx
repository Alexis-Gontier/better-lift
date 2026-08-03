import { Link } from "expo-router";
import { useState } from "react";
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from "react-native";

import { type ExerciseSummary } from "@better-lift/validators";

import { ExerciseFilters } from "./exercise-filters";
import { ExerciseThumb } from "./exercise-thumb";
import { BODY_PART_LABELS, equipmentLabel } from "./labels";
import { useExerciseSearch } from "./use-exercise-search";

function PickerRow({
  exercise,
  rank,
  onToggle,
}: {
  exercise: ExerciseSummary;
  /** Rang dans la sélection, à partir de 1. `0` : non sélectionné. */
  rank: number;
  onToggle: () => void;
}) {
  const selected = rank > 0;

  return (
    <Pressable
      onPress={onToggle}
      style={[styles.row, selected && styles.rowSelected]}
      accessibilityRole="checkbox"
      accessibilityState={{ checked: selected }}
      accessibilityLabel={exercise.name}
    >
      <ExerciseThumb exercise={exercise} />

      <View style={styles.rowText}>
        <Text style={styles.rowTitle} numberOfLines={1}>
          {exercise.name}
        </Text>
        <Text style={styles.rowMeta} numberOfLines={1}>
          {exercise.isCustom ? "Personnalisé · " : ""}
          {BODY_PART_LABELS[exercise.bodyPart]} · {equipmentLabel(exercise.equipment)}
        </Text>
      </View>

      {/*
        Le rang plutôt qu'une simple coche : c'est l'ordre dans lequel les
        exercices entreront dans la séance, et il se lit avant de valider, quand
        il est encore modifiable.
      */}
      <View style={[styles.badge, selected && styles.badgeSelected]}>
        <Text style={[styles.badgeLabel, selected && styles.badgeLabelSelected]}>
          {selected ? rank : "+"}
        </Text>
      </View>
    </Pressable>
  );
}

/**
 * Sélecteur d'exercices (doc 06).
 *
 * Il sert les deux entrées de séance qui ne passent pas par une routine :
 * démarrer une séance libre et ajouter un exercice en cours de séance.
 *
 * ## Pourquoi une sélection multiple
 *
 * On ajoute rarement un seul mouvement : la séance libre s'écrit en trois ou
 * quatre exercices d'affilée. Valider un par un rouvrirait la liste autant de
 * fois, en perdant à chaque retour la recherche et le défilement.
 *
 * La sélection **survit au filtre** : elle est portée par l'objet exercice, pas
 * par un index de liste. On peut donc chercher « développé », cocher, effacer,
 * chercher « rowing », cocher, puis valider les deux.
 */
export function ExercisePicker({
  onConfirm,
  pending = false,
  error = null,
}: {
  onConfirm: (exercises: readonly ExerciseSummary[]) => void;
  pending?: boolean;
  error?: string | null;
}) {
  const { exercises, items, attributions, filters, unfiltered } = useExerciseSearch();
  const [selected, setSelected] = useState<ExerciseSummary[]>([]);

  function toggle(exercise: ExerciseSummary) {
    setSelected((current) =>
      current.some((entry) => entry.id === exercise.id)
        ? current.filter((entry) => entry.id !== exercise.id)
        : [...current, exercise],
    );
  }

  return (
    <View style={styles.screen}>
      <ExerciseFilters filters={filters} autoFocus />

      <FlatList
        data={items}
        keyExtractor={(exercise) => exercise.id}
        renderItem={({ item }) => (
          <PickerRow
            exercise={item}
            rank={selected.findIndex((entry) => entry.id === item.id) + 1}
            onToggle={() => {
              toggle(item);
            }}
          />
        )}
        contentContainerStyle={styles.list}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
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
              {/*
                Sans réseau, la séance continue : ce qui est déjà dans le
                brouillon reste saisissable. Seul l'ajout demande le catalogue.
              */}
              <Text style={styles.emptyHint}>{exercises.error.message}</Text>
              <Pressable style={styles.retry} onPress={() => void exercises.refetch()}>
                <Text style={styles.retryLabel}>Réessayer</Text>
              </Pressable>
            </View>
          ) : filters.custom === true && unfiltered ? (
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

      {/*
        La barre ne s'affiche qu'une fois quelque chose de coché : vide, elle ne
        ferait que manger une ligne de liste sur un écran déjà chargé.
      */}
      {selected.length === 0 ? null : (
        <View style={styles.bar}>
          {error ? <Text style={styles.error}>{error}</Text> : null}

          <Pressable
            onPress={() => {
              onConfirm(selected);
            }}
            disabled={pending}
            style={[styles.confirm, pending && styles.confirmOff]}
            accessibilityRole="button"
          >
            {pending ? (
              <ActivityIndicator color="#11161b" size="small" />
            ) : (
              <Text style={styles.confirmLabel}>
                Ajouter {selected.length} exercice{selected.length > 1 ? "s" : ""}
              </Text>
            )}
          </Pressable>
        </View>
      )}
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
    borderWidth: 1,
    borderColor: "transparent",
  },
  rowSelected: { borderColor: "#7ad6a5", backgroundColor: "#18241d" },
  rowText: { flex: 1 },
  rowTitle: { color: "#f2f4f6", fontSize: 15, fontWeight: "500" },
  rowMeta: { color: "#9aa3ad", fontSize: 13, marginTop: 2 },
  badge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#222931",
    alignItems: "center",
    justifyContent: "center",
  },
  badgeSelected: { backgroundColor: "#7ad6a5" },
  badgeLabel: { color: "#6d7680", fontSize: 15, fontWeight: "600" },
  badgeLabelSelected: { color: "#11161b" },
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
  bar: {
    padding: 16,
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: "#222931",
    backgroundColor: "#101418",
  },
  confirm: {
    backgroundColor: "#7ad6a5",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
  },
  confirmOff: { opacity: 0.6 },
  confirmLabel: { color: "#11161b", fontSize: 15, fontWeight: "600" },
  error: { color: "#f08a7a", fontSize: 13, textAlign: "center" },
});
