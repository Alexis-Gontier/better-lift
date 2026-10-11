import type { LucideIcon } from "lucide-react-native";
import { ActivityIndicator, Text } from "react-native";
import { CIBLE, creerStyles, espace, rayon, useCouleurs } from "../../lib/theme";
import { Appuyable } from "./appuyable";

/**
 * Une action secondaire, en contour (D118) : « Lancer » sur une carte. L'aplat
 * orange reste à la seule action principale de l'écran (D105).
 */
export function BoutonContour({
  libelle,
  onPress,
  icone: Icone,
  occupe = false,
}: {
  libelle: string;
  onPress: () => void;
  icone?: LucideIcon;
  /** Un chargement en cours : l'indicateur remplace l'icône, l'appui est coupé. */
  occupe?: boolean;
}) {
  const styles = useStyles();
  const couleurs = useCouleurs();
  return (
    <Appuyable
      onPress={onPress}
      disabled={occupe}
      style={styles.bouton}
      accessibilityRole="button"
      accessibilityState={{ busy: occupe, disabled: occupe }}
    >
      {occupe ? (
        <ActivityIndicator size="small" color={couleurs.encre} />
      ) : Icone ? (
        <Icone size={16} color={couleurs.encre} strokeWidth={2.4} />
      ) : null}
      <Text style={styles.libelle}>{libelle}</Text>
    </Appuyable>
  );
}

const useStyles = creerStyles((couleurs) => ({
  bouton: {
    minHeight: CIBLE,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: espace.s,
    paddingHorizontal: espace.l,
    borderRadius: rayon.bouton,
    borderWidth: 1.5,
    borderColor: couleurs.encre,
  },
  libelle: { color: couleurs.encre, fontSize: 15, fontWeight: "700" },
}));
