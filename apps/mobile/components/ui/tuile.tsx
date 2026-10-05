import { Text, View } from "react-native";
import { creerStyles } from "../../lib/theme";

/** Un chiffre et son libellé (D118) : la taille le met en valeur, pas la couleur. */
export function Tuile({ libelle, valeur }: { libelle: string; valeur: string }) {
  const styles = useStyles();
  return (
    <View style={styles.tuile} accessible accessibilityLabel={`${libelle} : ${valeur}`}>
      <Text style={styles.libelle}>{libelle}</Text>
      <Text style={styles.valeur} numberOfLines={1}>
        {valeur}
      </Text>
    </View>
  );
}

const useStyles = creerStyles((couleurs) => ({
  tuile: { flex: 1, gap: 2 },
  libelle: { color: couleurs.encreTertiaire, fontSize: 12 },
  valeur: {
    color: couleurs.encre,
    fontSize: 17,
    fontWeight: "700",
    fontVariant: ["tabular-nums"],
  },
}));
