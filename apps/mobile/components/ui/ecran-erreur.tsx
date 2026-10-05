import type { ErrorBoundaryProps } from "expo-router";
import { Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { CIBLE, creerStyles, espace, rayon, taille } from "../../lib/theme";
import { Appuyable } from "./appuyable";

/**
 * Ce qu'Expo Router affiche quand un écran plante, au lieu d'un écran mort
 * dans l'APK. Il ne lit AUCUN contexte de l'application (séance, requêtes) :
 * c'est peut-être lui qui vient de planter. `retry` refait le rendu de la route.
 */
export function EcranErreur({
  error,
  retry,
  message = "L'écran n'a pas pu s'afficher. Réessaie ; si ça recommence, relance l'application.",
}: ErrorBoundaryProps & { message?: string }) {
  const styles = useStyles();
  return (
    <SafeAreaView style={styles.ecran}>
      <View style={styles.centre} accessibilityRole="alert">
        <Text style={styles.titre} accessibilityRole="header">
          Quelque chose s'est mal passé.
        </Text>
        <Text style={styles.texte}>{message}</Text>
        {__DEV__ ? <Text style={styles.detail}>{error.message}</Text> : null}
      </View>
      <Appuyable onPress={retry} style={styles.bouton} accessibilityRole="button">
        <Text style={styles.boutonTexte}>Réessayer</Text>
      </Appuyable>
    </SafeAreaView>
  );
}

/** La variante de la séance : ce qui compte, c'est que rien n'est perdu. */
export function EcranErreurSeance(props: ErrorBoundaryProps) {
  return (
    <EcranErreur
      {...props}
      message="Ta séance est gardée sur le téléphone : rien n'est perdu. Réessaie pour la reprendre."
    />
  );
}

const useStyles = creerStyles((couleurs) => ({
  ecran: { flex: 1, backgroundColor: couleurs.canevas, padding: espace.xl },
  centre: { flex: 1, justifyContent: "center", gap: espace.m },
  titre: { color: couleurs.encre, fontSize: taille.titre, fontWeight: "600" },
  texte: { color: couleurs.encreSecondaire, fontSize: taille.courant, lineHeight: 22 },
  detail: { color: couleurs.dangerEncre, fontSize: taille.petit },
  bouton: {
    minHeight: CIBLE + 8,
    borderRadius: rayon.bouton,
    backgroundColor: couleurs.action,
    alignItems: "center",
    justifyContent: "center",
  },
  boutonTexte: { color: couleurs.surAction, fontSize: taille.courant, fontWeight: "700" },
}));
