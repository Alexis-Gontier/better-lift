import { Dumbbell } from "lucide-react-native";
import { StyleSheet, View } from "react-native";
import { couleurs } from "../../lib/theme";

/**
 * Le logo : l'haltère Lucide redressée de 45°, en encre sur un aplat lime — le
 * même dessin que le bouton central et que l'icône de l'application.
 */
export function Logo({ taille = 24 }: { taille?: number }) {
  return (
    <View
      style={[styles.fond, { width: taille, height: taille, borderRadius: taille * 0.22 }]}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      {/* La rotation se pose sur une vue : sur l'icône SVG, `style` est ignoré. */}
      <View style={styles.redresse}>
        <Dumbbell size={taille * 0.62} color={couleurs.surAccent} strokeWidth={2.25} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  fond: { alignItems: "center", justifyContent: "center", backgroundColor: couleurs.accent },
  redresse: { transform: [{ rotate: "45deg" }] },
});
