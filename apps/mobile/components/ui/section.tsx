import { type StyleProp, Text, type TextStyle } from "react-native";
import { creerStyles } from "../../lib/theme";

/** L'en-tête d'une section (D118) : petites capitales, encre atténuée. */
export function Section({ titre, style }: { titre: string; style?: StyleProp<TextStyle> }) {
  const styles = useStyles();
  return (
    <Text style={[styles.section, style]} accessibilityRole="header">
      {titre}
    </Text>
  );
}

const useStyles = creerStyles((couleurs) => ({
  section: {
    color: couleurs.encreAttenuee,
    fontSize: 12,
    fontWeight: "600",
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
}));
