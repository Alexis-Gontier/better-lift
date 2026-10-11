import { formaterCharge } from "@better-lift/shared";
import { ArrowUp } from "lucide-react-native";
import { Text, View } from "react-native";
import { creerStyles, taille, useCouleurs } from "../../lib/theme";
import { SYSTEME_UNITES } from "../../lib/unites";

/**
 * Le record est un CONTOUR (D28) : orange en texte sur fond teinté, flèche
 * montante. L'aplat reste réservé à l'action.
 */
export function BadgeRecord({ libelle }: { libelle: string }) {
  const styles = useStyles();
  const couleurs = useCouleurs();
  return (
    <View style={styles.badge}>
      <ArrowUp size={12} strokeWidth={2.6} color={couleurs.recordEncre} />
      <Text style={styles.texte}>{libelle}</Text>
    </View>
  );
}

/** « 85 kg × 5 », ou « 12 reps » au poids du corps. La charge passe par les unités. */
export function formaterSerie(chargeKg: number | null, reps: number | null): string {
  if (chargeKg === null) return reps === null ? "—" : `${reps} reps`;
  return `${formaterCharge(chargeKg, SYSTEME_UNITES)} × ${reps ?? "—"}`;
}

const useStyles = creerStyles((couleurs) => ({
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    alignSelf: "flex-start",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    backgroundColor: couleurs.recordFond,
  },
  texte: { color: couleurs.recordEncre, fontSize: taille.petit, fontVariant: ["tabular-nums"] },
}));
