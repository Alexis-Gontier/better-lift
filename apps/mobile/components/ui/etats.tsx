import { ActivityIndicator, Text, View } from "react-native";
import { CIBLE, creerStyles, espace, rayon, taille, useCouleurs } from "../../lib/theme";
import { Appuyable } from "./appuyable";

/**
 * Les quatre états de chaque écran (chargement, erreur, vide — le nominal est
 * l'écran lui-même). Une seule implémentation : un écran qui les dessinerait à
 * sa façon finirait par en oublier un.
 */
export function Chargement() {
  const styles = useStyles();
  const couleurs = useCouleurs();
  return (
    <View style={styles.centre} accessibilityLabel="Chargement">
      <ActivityIndicator color={couleurs.encreTertiaire} />
    </View>
  );
}

export function Erreur({ message, onReessayer }: { message: string; onReessayer: () => void }) {
  const styles = useStyles();
  return (
    <View style={styles.centre}>
      <Text style={styles.texte}>{message}</Text>
      <Appuyable onPress={onReessayer} style={styles.bouton} accessibilityRole="button">
        <Text style={styles.boutonTexte}>Réessayer</Text>
      </Appuyable>
    </View>
  );
}

export function Vide({ titre, message }: { titre: string; message: string }) {
  const styles = useStyles();
  return (
    <View style={styles.centre}>
      <Text style={styles.titre} accessibilityRole="header">
        {titre}
      </Text>
      <Text style={styles.texte}>{message}</Text>
    </View>
  );
}

const useStyles = creerStyles((couleurs) => ({
  centre: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: espace.m,
    padding: espace.xl,
  },
  titre: { color: couleurs.encre, fontSize: taille.courant, fontWeight: "600" },
  texte: { color: couleurs.encreTertiaire, fontSize: taille.petit + 1, textAlign: "center" },
  bouton: {
    minHeight: CIBLE,
    paddingHorizontal: espace.xl,
    borderRadius: rayon.bouton,
    borderWidth: 1,
    borderColor: couleurs.ligneForte,
    justifyContent: "center",
  },
  boutonTexte: { color: couleurs.encre, fontSize: taille.courant },
}));
