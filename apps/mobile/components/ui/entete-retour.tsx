import { useRouter } from "expo-router";
import { ChevronLeft } from "lucide-react-native";
import type { ReactNode } from "react";
import { Text, View } from "react-native";
import { CIBLE, creerStyles, espace, taille, useCouleurs } from "../../lib/theme";
import { Appuyable } from "./appuyable";

/**
 * L'en-tête d'un écran empilé : retour à gauche, titre sur toute la largeur,
 * et au besoin une action à droite.
 */
export function EnteteRetour({ titre, action }: { titre: string; action?: ReactNode }) {
  const styles = useStyles();
  const couleurs = useCouleurs();
  const router = useRouter();
  return (
    <View style={styles.entete}>
      <Appuyable
        onPress={() => router.back()}
        style={styles.retour}
        accessibilityRole="button"
        accessibilityLabel="Retour"
      >
        <ChevronLeft size={26} color={couleurs.encre} />
      </Appuyable>
      <Text style={styles.titre} accessibilityRole="header" numberOfLines={2}>
        {titre}
      </Text>
      {action}
    </View>
  );
}

const useStyles = creerStyles((couleurs) => ({
  entete: {
    flexDirection: "row",
    alignItems: "center",
    gap: espace.xs,
    paddingHorizontal: espace.s,
    paddingVertical: espace.s,
    borderBottomWidth: 1,
    borderBottomColor: couleurs.ligne,
  },
  retour: { width: CIBLE, height: CIBLE, alignItems: "center", justifyContent: "center" },
  titre: { flex: 1, color: couleurs.encre, fontSize: taille.grand, fontWeight: "700" },
}));
