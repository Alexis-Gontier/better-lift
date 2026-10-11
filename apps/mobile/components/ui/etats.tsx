import { useEffect } from "react";
import { Text, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";
import { CIBLE, creerStyles, espace, rayon, taille } from "../../lib/theme";
import { Appuyable } from "./appuyable";

/**
 * Les quatre états de chaque écran (chargement, erreur, vide — le nominal est
 * l'écran lui-même). Une seule implémentation : un écran qui les dessinerait à
 * sa façon finirait par en oublier un.
 */
/**
 * Le chargement d'une page (D176) : un squelette de cartes, pas un indicateur
 * au milieu du contenu (NN/g : de 1 à 10 s, la forme de la page rassure). Il
 * pulse doucement, immobile si le téléphone demande moins d'animations.
 */
export function Chargement() {
  const styles = useStyles();
  const reduit = useReducedMotion();
  const opacite = useSharedValue(1);
  useEffect(() => {
    if (reduit) return;
    opacite.value = withRepeat(withTiming(0.5, { duration: 900 }), -1, true);
  }, [reduit, opacite]);
  const pulse = useAnimatedStyle(() => ({ opacity: opacite.value }));
  return (
    <Animated.View
      style={[styles.squelette, pulse]}
      accessible
      accessibilityLabel="Chargement"
      accessibilityRole="progressbar"
    >
      <View style={[styles.bloc, { height: 96 }]} />
      <View style={[styles.bloc, { height: 64 }]} />
      <View style={[styles.bloc, { height: 64 }]} />
    </Animated.View>
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
  squelette: { flex: 1, gap: espace.m, padding: espace.l },
  bloc: { borderRadius: rayon.carte, backgroundColor: couleurs.surface1 },
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
