import { Link } from "expo-router";
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from "react-native";

import { ApiClientError, useWorkout } from "@better-lift/api-client";
import { type WorkoutExercise } from "@better-lift/validators";

import { formatElapsed } from "./use-ticker";
import { useProfileLocale } from "@/features/account/use-profile-locale";
import { SET_TYPE_SHORT, SET_TYPE_TONE } from "@/features/routines/labels";
import { apiClient } from "@/lib/api";

/**
 * Séance enregistrée, en lecture.
 *
 * Les agrégats affichés viennent **tels quels** de l'API : ils sont calculés
 * serveur à l'écriture (doc 03, §3). Les recalculer ici donnerait deux réponses
 * possibles à la même question — et le client serait le premier à se tromper,
 * n'ayant pas le type de chaque exercice sous la main.
 */
function ExerciseBlock({ exercise }: { exercise: WorkoutExercise }) {
  const done = exercise.sets.filter((set) => set.completed);

  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle} numberOfLines={2}>
        {exercise.exercise.name}
      </Text>

      {done.length === 0 ? (
        <Text style={styles.skipped}>Aucune série validée.</Text>
      ) : (
        done.map((set, index) => (
          <View key={set.id} style={styles.row}>
            <Text style={[styles.index, { color: SET_TYPE_TONE[set.type] }]}>
              {SET_TYPE_SHORT[set.type] || index + 1}
            </Text>
            <Text style={styles.value}>
              {set.weightKg === null ? "" : `${set.weightKg} kg`}
              {set.weightKg !== null && set.reps !== null ? " × " : ""}
              {set.reps === null ? "" : `${set.reps}`}
              {set.durationSec === null ? "" : ` ${set.durationSec} s`}
              {set.distanceM === null ? "" : ` ${set.distanceM} m`}
            </Text>
            {/* Le trophée vient du serveur : `isPr` est posé au calcul des records. */}
            {set.isPr ? <Text style={styles.pr}>Record</Text> : null}
          </View>
        ))
      )}
    </View>
  );
}

export function WorkoutSummary({ id }: { id: string }) {
  const locale = useProfileLocale();
  const workout = useWorkout(apiClient, id, locale);

  if (workout.isPending) {
    return <ActivityIndicator color="#7ad6a5" style={styles.spacer} />;
  }

  if (workout.isError) {
    const missing = workout.error instanceof ApiClientError && workout.error.status === 404;

    return (
      <View style={styles.empty}>
        <Text style={styles.emptyTitle}>
          {missing ? "Cette séance n’existe plus" : "Séance indisponible"}
        </Text>
        <Text style={styles.emptyHint}>
          {missing ? "Elle a pu être supprimée depuis." : workout.error.message}
        </Text>
        <Link href="/" style={styles.link}>
          Retour à l’accueil
        </Link>
      </View>
    );
  }

  const data = workout.data;

  return (
    <ScrollView contentContainerStyle={styles.screen}>
      <View>
        <Text style={styles.title}>{data.title}</Text>
        <Text style={styles.subtitle}>
          {new Intl.DateTimeFormat(locale, { dateStyle: "full", timeStyle: "short" }).format(
            new Date(data.startedAt),
          )}
        </Text>
      </View>

      <View style={styles.totals}>
        <Total label="Durée" value={formatElapsed(data.durationSec)} />
        <Total label="Volume" value={`${data.totalVolumeKg} kg`} />
        <Total label="Séries" value={String(data.totalSets)} />
        <Total label="Records" value={String(data.prCount)} />
      </View>

      {data.notes ? <Text style={styles.notes}>{data.notes}</Text> : null}

      {data.exercises.map((exercise) => (
        <ExerciseBlock key={exercise.id} exercise={exercise} />
      ))}
    </ScrollView>
  );
}

function Total({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.total}>
      <Text style={styles.totalLabel}>{label}</Text>
      <Text style={styles.totalValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { padding: 20, gap: 14 },
  title: { color: "#f2f4f6", fontSize: 22, fontWeight: "600" },
  subtitle: { color: "#9aa3ad", fontSize: 14, marginTop: 4 },
  totals: { flexDirection: "row", gap: 10 },
  total: { flex: 1, backgroundColor: "#1a1f25", borderRadius: 12, padding: 12, gap: 4 },
  totalLabel: { color: "#6d7680", fontSize: 11, textTransform: "uppercase", letterSpacing: 1 },
  totalValue: { color: "#f2f4f6", fontSize: 16, fontVariant: ["tabular-nums"], fontWeight: "600" },
  notes: { color: "#9aa3ad", fontSize: 13 },
  card: { backgroundColor: "#1a1f25", borderRadius: 14, padding: 14, gap: 4 },
  cardTitle: { color: "#f2f4f6", fontSize: 15, fontWeight: "500", marginBottom: 4 },
  row: { flexDirection: "row", alignItems: "center", gap: 10 },
  index: { width: 40, fontSize: 14, fontWeight: "600" },
  value: { color: "#f2f4f6", fontSize: 14, fontVariant: ["tabular-nums"], flex: 1 },
  pr: { color: "#e8c468", fontSize: 12, fontWeight: "600" },
  skipped: { color: "#6d7680", fontSize: 13 },
  empty: { padding: 24, gap: 8, alignItems: "center" },
  emptyTitle: { color: "#f2f4f6", fontWeight: "600" },
  emptyHint: { color: "#9aa3ad", fontSize: 13, textAlign: "center" },
  link: { color: "#7ad6a5", marginTop: 8 },
  spacer: { paddingVertical: 24 },
});
