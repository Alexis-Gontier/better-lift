import { Image, StyleSheet, Text, View } from "react-native";

import { type ExerciseSummary } from "@better-lift/validators";

import { resolveMediaUrl } from "./media";

/**
 * Vignette d'un exercice, avec son repli.
 *
 * `MEDIA_BASE_URL` est vide tant que les médias ne sont pas hébergés (D17) :
 * l'initiale n'est donc pas un cas d'erreur mais l'affichage courant, et elle
 * doit rester lisible à côté du nom plutôt que ressembler à une image cassée.
 */
export function ExerciseThumb({ exercise }: { exercise: ExerciseSummary }) {
  const media = resolveMediaUrl(exercise.thumbnailUrl);

  if (!media) {
    return (
      <View style={[styles.thumb, styles.fallback]}>
        <Text style={styles.initial}>{exercise.name.slice(0, 1).toUpperCase()}</Text>
      </View>
    );
  }

  return <Image source={{ uri: media }} style={styles.thumb} accessibilityIgnoresInvertColors />;
}

const styles = StyleSheet.create({
  thumb: { width: 48, height: 48, borderRadius: 8 },
  fallback: { backgroundColor: "#222931", alignItems: "center", justifyContent: "center" },
  initial: { color: "#9aa3ad", fontSize: 18, fontWeight: "600" },
});
