import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";

import { useExerciseHistory, useExerciseRecords } from "@better-lift/api-client";
import { type ExerciseHistoryEntry, type RecordType, type SetType } from "@better-lift/validators";

import { useProfileLocale } from "@/features/account/use-profile-locale";
import { SET_TYPE_SHORT, SET_TYPE_TONE } from "@/features/routines/labels";
import { apiClient } from "@/lib/api";

/**
 * Records et historique d'un exercice (doc 06, § Exercices).
 *
 * Deux requêtes à part de la fiche : elles dépendent des séances, pas du
 * catalogue, et se rafraîchissent donc à un tout autre rythme. Elles arrivent
 * après la fiche plutôt que de la retarder.
 */

/**
 * Formulés comme ce qu'on a battu, pas comme un nom de colonne. Le 1RM garde
 * son sigle, qui est le mot du domaine.
 */
const RECORD_TYPE_LABELS: Record<RecordType, string> = {
  BEST_1RM: "1RM estimé",
  BEST_WEIGHT: "Charge max",
  BEST_SET_VOLUME: "Volume sur une série",
  BEST_REPS: "Répétitions max",
  BEST_DURATION: "Durée max",
  BEST_DISTANCE: "Distance max",
};

/** Unité du record, par type : des reps et des secondes ne sont pas des kg. */
function recordValue(type: RecordType, value: string): string {
  switch (type) {
    case "BEST_1RM":
    case "BEST_WEIGHT":
    case "BEST_SET_VOLUME":
      return `${value} kg`;
    case "BEST_REPS":
      return `${Math.round(Number(value))} reps`;
    case "BEST_DURATION":
      return `${Math.round(Number(value))} s`;
    case "BEST_DISTANCE":
      return `${Math.round(Number(value))} m`;
  }
}

/** Une série, écrite comme on la lit à voix haute : « 100 kg × 5 ». */
function setLabel(set: ExerciseHistoryEntry["sets"][number]): string {
  const parts: string[] = [];

  if (set.weightKg !== null) {
    parts.push(`${set.weightKg} kg`);
  }

  if (set.reps !== null) {
    parts.push(`${set.reps} reps`);
  }

  if (set.durationSec !== null) {
    parts.push(`${set.durationSec} s`);
  }

  if (set.distanceM !== null) {
    parts.push(`${set.distanceM} m`);
  }

  return parts.join(" × ") || "—";
}

function SetRow({ set, index }: { set: ExerciseHistoryEntry["sets"][number]; index: number }) {
  const type: SetType = set.type;

  return (
    <View style={styles.setRow}>
      <Text style={[styles.setIndex, { color: SET_TYPE_TONE[type] }]}>
        {SET_TYPE_SHORT[type] || index + 1}
      </Text>
      {/*
        Une série non validée reste affichée — elle dit ce qui était prévu et
        n'a pas été fait — mais en retrait : elle ne compte ni dans le volume ni
        dans les records (doc 03).
      */}
      <Text style={[styles.setValue, !set.completed && styles.setSkipped]}>{setLabel(set)}</Text>
      {set.isPr ? <Text style={styles.pr}>Record</Text> : null}
    </View>
  );
}

export function ExerciseLog({ id }: { id: string }) {
  const locale = useProfileLocale();
  const intlLocale = locale === "en" ? "en-GB" : "fr-FR";
  const records = useExerciseRecords(apiClient, id);
  const history = useExerciseHistory(apiClient, id);

  const entries = history.data?.pages.flatMap((page) => page.data) ?? [];
  const dateFormatter = new Intl.DateTimeFormat(intlLocale, {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <>
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Records</Text>

        {records.isPending ? (
          <ActivityIndicator color="#7ad6a5" />
        ) : records.isError ? (
          <Text style={styles.hint}>Records indisponibles.</Text>
        ) : records.data.data.length === 0 ? (
          <Text style={styles.hint}>
            Aucun record. Ils se calculent tout seuls, à la première séance enregistrée.
          </Text>
        ) : (
          records.data.data.map((record) => (
            <View key={record.id} style={styles.row}>
              <Text style={styles.rowLabel}>{RECORD_TYPE_LABELS[record.type]}</Text>
              <Text style={styles.rowValue}>{recordValue(record.type, record.value)}</Text>
            </View>
          ))
        )}
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Historique</Text>

        {history.isPending ? (
          <ActivityIndicator color="#7ad6a5" />
        ) : history.isError ? (
          <Text style={styles.hint}>Historique indisponible.</Text>
        ) : entries.length === 0 ? (
          <Text style={styles.hint}>Cet exercice n’a encore été fait dans aucune séance.</Text>
        ) : (
          entries.map((entry) => (
            <View key={entry.id} style={styles.entry}>
              <View style={styles.entryHeader}>
                <Text style={styles.entryTitle} numberOfLines={1}>
                  {entry.workoutTitle}
                </Text>
                <Text style={styles.entryDate}>
                  {dateFormatter.format(new Date(entry.performedAt))}
                </Text>
              </View>

              {entry.sets.length === 0 ? (
                <Text style={styles.hint}>Aucune série enregistrée.</Text>
              ) : (
                entry.sets.map((set, index) => (
                  <SetRow key={`${entry.id}-${set.position}`} set={set} index={index} />
                ))
              )}
            </View>
          ))
        )}

        {history.hasNextPage ? (
          <Pressable
            onPress={() => void history.fetchNextPage()}
            disabled={history.isFetchingNextPage}
            style={styles.more}
            accessibilityRole="button"
          >
            <Text style={styles.moreLabel}>
              {history.isFetchingNextPage ? "Chargement…" : "Séances plus anciennes"}
            </Text>
          </Pressable>
        ) : null}
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: "#1a1f25", borderRadius: 14, padding: 16, gap: 10 },
  cardTitle: {
    color: "#9aa3ad",
    fontSize: 11,
    fontWeight: "600",
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  row: { flexDirection: "row", justifyContent: "space-between", gap: 16 },
  rowLabel: { color: "#9aa3ad", fontSize: 14 },
  rowValue: { color: "#f2f4f6", fontSize: 14, fontVariant: ["tabular-nums"] },
  hint: { color: "#9aa3ad", fontSize: 13 },
  entry: { gap: 4 },
  entryHeader: { flexDirection: "row", justifyContent: "space-between", gap: 12 },
  entryTitle: { color: "#f2f4f6", fontSize: 14, fontWeight: "500", flexShrink: 1 },
  entryDate: { color: "#6d7680", fontSize: 12 },
  setRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  setIndex: { fontSize: 12, fontWeight: "600", width: 18 },
  setValue: { color: "#f2f4f6", fontSize: 14, fontVariant: ["tabular-nums"] },
  setSkipped: { color: "#4d545c" },
  pr: { color: "#e8c468", fontSize: 11, fontWeight: "600" },
  more: { paddingVertical: 10, alignItems: "center" },
  moreLabel: { color: "#7ad6a5", fontSize: 14 },
});
