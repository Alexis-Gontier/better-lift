import { formaterCharge } from "@better-lift/shared";
import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";
import { couleurs, taille } from "../../lib/theme";
import { SYSTEME_UNITES } from "../../lib/unites";

/**
 * Le record est un CONTOUR (D28) : lime en texte sur fond teinté, flèche
 * montante. L'aplat reste réservé à l'action.
 */
export function BadgeRecord({ libelle }: { libelle: string }) {
  return (
    <View style={styles.badge}>
      <Ionicons name="arrow-up" size={12} color={couleurs.accent} />
      <Text style={styles.texte}>{libelle}</Text>
    </View>
  );
}

/** « 85 kg × 5 », ou « 12 reps » au poids du corps. La charge passe par les unités. */
export function formaterSerie(chargeKg: number | null, reps: number | null): string {
  if (chargeKg === null) return reps === null ? "—" : `${reps} reps`;
  return `${formaterCharge(chargeKg, SYSTEME_UNITES)} × ${reps ?? "—"}`;
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    alignSelf: "flex-start",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    backgroundColor: couleurs.accentLavis,
  },
  texte: { color: couleurs.accent, fontSize: taille.petit, fontVariant: ["tabular-nums"] },
});
