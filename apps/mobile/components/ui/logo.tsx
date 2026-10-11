import { Dumbbell } from "lucide-react-native";
import { View } from "react-native";
import { creerStyles, useCouleurs } from "../../lib/theme";

/**
 * Le logo : l'haltère Lucide redressée de 45°, en encre sur un aplat orange — le
 * même dessin que l'icône de l'application.
 */
export function Logo({ taille = 24 }: { taille?: number }) {
  const styles = useStyles();
  const couleurs = useCouleurs();
  return (
    <View
      style={[styles.fond, { width: taille, height: taille, borderRadius: taille * 0.22 }]}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      {/* La rotation se pose sur une vue : sur l'icône SVG, `style` est ignoré. */}
      <View style={styles.redresse}>
        <Dumbbell size={taille * 0.62} color={couleurs.surAction} strokeWidth={2.25} />
      </View>
    </View>
  );
}

const useStyles = creerStyles((couleurs) => ({
  fond: { alignItems: "center", justifyContent: "center", backgroundColor: couleurs.action },
  redresse: { transform: [{ rotate: "45deg" }] },
}));
