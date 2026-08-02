import { Pressable, StyleSheet, Text, View } from "react-native";

import { formatElapsed } from "./use-ticker";

const STEP_SEC = 15;

/**
 * Minuteur de repos, affiché en bas de l'écran de séance (doc 06).
 *
 * Il tient une **échéance**, pas un compte à rebours : le temps restant est la
 * différence avec l'instant courant, donc l'app peut passer en arrière-plan
 * sans que le minuteur dérive. Ajuster de ±15 s déplace l'échéance.
 */
export function RestTimer({
  endsAt,
  now,
  onAdjust,
  onDismiss,
}: {
  endsAt: number;
  now: number;
  onAdjust: (deltaSec: number) => void;
  onDismiss: () => void;
}) {
  const remaining = Math.round((endsAt - now) / 1000);
  const over = remaining <= 0;

  return (
    <View style={[styles.bar, over && styles.barOver]}>
      <Pressable
        onPress={() => {
          onAdjust(-STEP_SEC);
        }}
        style={styles.step}
        accessibilityRole="button"
        accessibilityLabel="Retirer 15 secondes de repos"
      >
        <Text style={styles.stepLabel}>−15</Text>
      </Pressable>

      <Pressable onPress={onDismiss} style={styles.center} accessibilityRole="button">
        <Text style={styles.caption}>{over ? "Repos terminé" : "Repos"}</Text>
        <Text style={[styles.time, over && styles.timeOver]}>
          {over ? "C’est reparti" : formatElapsed(remaining)}
        </Text>
      </Pressable>

      <Pressable
        onPress={() => {
          onAdjust(STEP_SEC);
        }}
        style={styles.step}
        accessibilityRole="button"
        accessibilityLabel="Ajouter 15 secondes de repos"
      >
        <Text style={styles.stepLabel}>+15</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#1a1f25",
    borderTopWidth: 1,
    borderTopColor: "#222931",
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 12,
  },
  barOver: { backgroundColor: "#1d2a22" },
  center: { flex: 1, alignItems: "center" },
  caption: { color: "#6d7680", fontSize: 11, textTransform: "uppercase", letterSpacing: 1 },
  time: { color: "#f2f4f6", fontSize: 22, fontVariant: ["tabular-nums"], fontWeight: "600" },
  timeOver: { color: "#7ad6a5", fontSize: 18 },
  step: {
    backgroundColor: "#222931",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    minWidth: 56,
    alignItems: "center",
  },
  stepLabel: { color: "#f2f4f6", fontSize: 15, fontVariant: ["tabular-nums"] },
});
