import { Link } from "expo-router";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { ApiClientError, useRoutine } from "@better-lift/api-client";
import { type RoutineExercise } from "@better-lift/validators";

import { formatRest, SET_TYPE_SHORT, SET_TYPE_TONE } from "./labels";
import { useProfileLocale } from "@/features/account/use-profile-locale";
import { BODY_PART_LABELS, equipmentLabel } from "@/features/exercises/labels";
import { useStartWorkout } from "@/features/workouts/use-start-workout";
import { apiClient } from "@/lib/api";

/**
 * Aperçu d'une routine, en lecture seule (doc 06).
 *
 * Les cibles non renseignées s'affichent « — » et non `0` : une routine peut
 * ne prescrire qu'un nombre de séries, et un zéro laisserait croire à une
 * charge nulle demandée.
 */
function ExerciseBlock({ exercise, index }: { exercise: RoutineExercise; index: number }) {
  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardTitle} numberOfLines={2}>
          <Text style={styles.cardIndex}>{index + 1}. </Text>
          {exercise.exercise.name}
        </Text>
        <Text style={styles.cardMeta} numberOfLines={1}>
          {BODY_PART_LABELS[exercise.exercise.bodyPart]} ·{" "}
          {equipmentLabel(exercise.exercise.equipment)}
          {exercise.restSec === null ? "" : ` · repos ${formatRest(exercise.restSec)}`}
        </Text>
      </View>

      {exercise.notes ? <Text style={styles.notes}>{exercise.notes}</Text> : null}

      <View style={styles.tableHead}>
        <Text style={[styles.cell, styles.cellIndex, styles.headText]}>#</Text>
        <Text style={[styles.cell, styles.headText]}>kg</Text>
        <Text style={[styles.cell, styles.headText]}>Reps</Text>
        <Text style={[styles.cell, styles.headText]}>RPE</Text>
      </View>

      {exercise.sets.map((set, setIndex) => (
        <View key={set.id} style={styles.row}>
          <Text style={[styles.cell, styles.cellIndex, { color: SET_TYPE_TONE[set.type] }]}>
            {SET_TYPE_SHORT[set.type] || setIndex + 1}
          </Text>
          <Text style={[styles.cell, styles.value]}>{set.targetWeightKg ?? "—"}</Text>
          <Text style={[styles.cell, styles.value]}>{set.targetReps ?? "—"}</Text>
          <Text style={[styles.cell, styles.value]}>{set.targetRpe ?? "—"}</Text>
        </View>
      ))}
    </View>
  );
}

export function RoutinePreview({ id }: { id: string }) {
  const locale = useProfileLocale();
  const routine = useRoutine(apiClient, id, locale);
  const { start, starting, inProgress } = useStartWorkout(apiClient);

  if (routine.isPending) {
    return <ActivityIndicator color="#7ad6a5" style={styles.spacer} />;
  }

  if (routine.isError) {
    // Un 404 n'est pas une panne : la routine a été supprimée depuis le web.
    const missing = routine.error instanceof ApiClientError && routine.error.status === 404;

    return (
      <View style={styles.empty}>
        <Text style={styles.emptyTitle}>
          {missing ? "Cette routine n’existe plus" : "Routine indisponible"}
        </Text>
        <Text style={styles.emptyHint}>
          {missing ? "Elle a pu être supprimée depuis." : routine.error.message}
        </Text>
        <Link href="/routines" style={styles.link}>
          Retour aux routines
        </Link>
      </View>
    );
  }

  const data = routine.data;

  return (
    <ScrollView contentContainerStyle={styles.screen}>
      <View>
        <Text style={styles.title}>{data.name}</Text>
        <Text style={styles.subtitle}>
          {data.exercises.length} exercice{data.exercises.length > 1 ? "s" : ""}
        </Text>
        {data.notes ? <Text style={styles.notes}>{data.notes}</Text> : null}
      </View>

      {data.exercises.length === 0 ? null : (
        <Pressable
          onPress={() => {
            void start(data);
          }}
          disabled={starting}
          style={styles.start}
          accessibilityRole="button"
        >
          <Text style={styles.startLabel}>
            {inProgress ? "Reprendre la séance en cours" : "Démarrer la séance"}
          </Text>
        </Pressable>
      )}

      {data.exercises.length === 0 ? (
        <Text style={styles.emptyHint}>Cette routine ne contient aucun exercice.</Text>
      ) : (
        data.exercises.map((exercise, index) => (
          <ExerciseBlock key={exercise.id} exercise={exercise} index={index} />
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { padding: 20, gap: 14 },
  title: { color: "#f2f4f6", fontSize: 22, fontWeight: "600" },
  subtitle: { color: "#9aa3ad", fontSize: 14, marginTop: 4 },
  notes: { color: "#9aa3ad", fontSize: 13, marginTop: 6 },
  card: { backgroundColor: "#1a1f25", borderRadius: 14, padding: 14 },
  cardHeader: { gap: 2 },
  cardTitle: { color: "#f2f4f6", fontSize: 15, fontWeight: "500" },
  cardIndex: { color: "#9aa3ad" },
  cardMeta: { color: "#9aa3ad", fontSize: 13 },
  tableHead: {
    flexDirection: "row",
    marginTop: 10,
    paddingBottom: 4,
    borderBottomWidth: 1,
    borderBottomColor: "#222931",
  },
  row: { flexDirection: "row", paddingVertical: 5 },
  cell: { flex: 1, fontSize: 14 },
  cellIndex: { flex: 0, width: 48 },
  headText: { color: "#6d7680", fontSize: 12 },
  value: { color: "#f2f4f6", fontVariant: ["tabular-nums"] },
  empty: { padding: 24, gap: 8, alignItems: "center" },
  emptyTitle: { color: "#f2f4f6", fontWeight: "600" },
  emptyHint: { color: "#9aa3ad", fontSize: 13, textAlign: "center" },
  link: { color: "#7ad6a5", marginTop: 8 },
  spacer: { paddingVertical: 24 },
  start: {
    backgroundColor: "#7ad6a5",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
  },
  startLabel: { color: "#11161b", fontSize: 15, fontWeight: "600" },
});
