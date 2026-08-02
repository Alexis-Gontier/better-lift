import { ActivityIndicator, Image, ScrollView, StyleSheet, Text, View } from "react-native";

import { ApiClientError, useExercise } from "@better-lift/api-client";

import { BODY_PART_LABELS, equipmentLabel } from "./labels";
import { resolveMediaUrl } from "./media";
import { useProfileLocale } from "@/features/account/use-profile-locale";
import { apiClient } from "@/lib/api";

/**
 * Fiche d'un exercice (doc 06, § Exercices).
 *
 * Records et historique personnel viendront avec les séances : ils n'ont rien à
 * afficher tant que `POST /v1/workouts` n'existe pas.
 */
export function ExerciseDetail({ id }: { id: string }) {
  const locale = useProfileLocale();
  const exercise = useExercise(apiClient, id, locale);

  if (exercise.isPending) {
    return <ActivityIndicator color="#7ad6a5" style={styles.spacer} />;
  }

  if (exercise.isError) {
    // Un 404 n'est pas une panne : l'exercice a été archivé du catalogue.
    const missing = exercise.error instanceof ApiClientError && exercise.error.status === 404;

    return (
      <View style={styles.empty}>
        <Text style={styles.emptyTitle}>
          {missing ? "Cet exercice n’est plus au catalogue" : "Fiche indisponible"}
        </Text>
        <Text style={styles.emptyHint}>
          {missing ? "Il a pu être archivé depuis." : exercise.error.message}
        </Text>
      </View>
    );
  }

  const data = exercise.data;
  const media = resolveMediaUrl(data.animationUrl ?? data.thumbnailUrl);

  return (
    <ScrollView contentContainerStyle={styles.screen}>
      <View>
        <Text style={styles.title}>{data.name}</Text>
        <Text style={styles.subtitle}>
          {BODY_PART_LABELS[data.bodyPart]} · {equipmentLabel(data.equipment)}
        </Text>
      </View>

      {media && (
        <View style={styles.mediaBlock}>
          <Image source={{ uri: media }} style={styles.media} accessibilityIgnoresInvertColors />
          {/* Obligatoire partout où le média apparaît (D17, doc 08). */}
          {data.attribution && <Text style={styles.attribution}>{data.attribution}</Text>}
        </View>
      )}

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Muscles</Text>
        <View style={styles.row}>
          <Text style={styles.rowLabel}>Cible</Text>
          <Text style={styles.rowValue}>{data.target}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.rowLabel}>Secondaires</Text>
          <Text style={styles.rowValue}>
            {data.secondaryMuscles.length ? data.secondaryMuscles.join(", ") : "—"}
          </Text>
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Instructions</Text>
        {data.instructions.length > 0 ? (
          data.instructions.map((step, index) => (
            <View key={step} style={styles.step}>
              <Text style={styles.stepIndex}>{index + 1}.</Text>
              <Text style={styles.stepText}>{step}</Text>
            </View>
          ))
        ) : (
          <Text style={styles.emptyHint}>Aucune instruction dans cette langue.</Text>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { padding: 20, gap: 16 },
  title: { color: "#f2f4f6", fontSize: 22, fontWeight: "600" },
  subtitle: { color: "#9aa3ad", fontSize: 14, marginTop: 4 },
  mediaBlock: { gap: 6 },
  media: { width: "100%", aspectRatio: 1, borderRadius: 14, backgroundColor: "#1a1f25" },
  attribution: { color: "#6d7680", fontSize: 11 },
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
  rowValue: { color: "#f2f4f6", fontSize: 14, flexShrink: 1, textAlign: "right" },
  step: { flexDirection: "row", gap: 8 },
  stepIndex: { color: "#7ad6a5", fontSize: 14, fontVariant: ["tabular-nums"] },
  stepText: { color: "#f2f4f6", fontSize: 14, flex: 1, lineHeight: 20 },
  empty: { padding: 24, gap: 8, alignItems: "center" },
  emptyTitle: { color: "#f2f4f6", fontWeight: "600" },
  emptyHint: { color: "#9aa3ad", fontSize: 13 },
  spacer: { paddingVertical: 24 },
});
