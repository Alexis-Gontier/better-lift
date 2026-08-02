import { useRouter } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { ApiClientError, useArchiveExercise, useExercise } from "@better-lift/api-client";

import { BODY_PART_LABELS, equipmentLabel } from "./labels";
import { resolveMediaUrl } from "./media";
import { useProfileLocale } from "@/features/account/use-profile-locale";
import { apiClient } from "@/lib/api";

/**
 * Archivage d'un exercice personnalisé, en deux temps.
 *
 * Pas d'`Alert.alert` : une boîte système au milieu d'une salle de sport, sur
 * un écran qu'on consulte d'un pouce, se valide par réflexe. Une confirmation
 * en place, qui remplace le bouton, demande un geste dirigé — et c'est le geste
 * accidentel qui est le seul risque, l'opération restant réversible en base.
 *
 * La **modification** n'est pas proposée ici : elle se fait sur le web, qui est
 * l'atelier (doc 01).
 */
function ArchiveAction({ id }: { id: string }) {
  const router = useRouter();
  const archive = useArchiveExercise(apiClient);
  const [confirming, setConfirming] = useState(false);

  if (!confirming) {
    return (
      <Pressable
        style={styles.ghostButton}
        onPress={() => setConfirming(true)}
        accessibilityRole="button"
      >
        <Text style={styles.ghostLabel}>Archiver cet exercice</Text>
      </Pressable>
    );
  }

  return (
    <View style={styles.confirm}>
      <Text style={styles.emptyHint}>
        Il disparaîtra des recherches. Les séances qui le citent restent lisibles.
      </Text>

      <Pressable
        style={[styles.dangerButton, archive.isPending && styles.disabled]}
        disabled={archive.isPending}
        accessibilityRole="button"
        onPress={() =>
          archive.mutate(id, {
            // La fiche répond désormais 404 : y rester afficherait une erreur
            // pour une opération pourtant réussie.
            onSuccess: () => router.back(),
          })
        }
      >
        <Text style={styles.dangerLabel}>
          {archive.isPending ? "Archivage…" : "Confirmer l’archivage"}
        </Text>
      </Pressable>

      <Pressable
        style={styles.ghostButton}
        onPress={() => setConfirming(false)}
        accessibilityRole="button"
      >
        <Text style={styles.ghostLabel}>Annuler</Text>
      </Pressable>

      {archive.isError && <Text style={styles.error}>{archive.error.message}</Text>}
    </View>
  );
}

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
          {data.isCustom ? "Personnalisé · " : ""}
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

      {data.isCustom && <ArchiveAction id={data.id} />}
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
  confirm: { gap: 10 },
  ghostButton: {
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#2a323b",
    paddingVertical: 12,
    alignItems: "center",
  },
  ghostLabel: { color: "#9aa3ad" },
  dangerButton: {
    backgroundColor: "#f2777a",
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: "center",
  },
  dangerLabel: { color: "#101418", fontWeight: "600" },
  disabled: { opacity: 0.5 },
  error: { color: "#f2777a", fontSize: 13 },
});
