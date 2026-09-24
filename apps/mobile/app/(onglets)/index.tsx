import { StyleSheet, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { couleurs, espace, taille } from "../../lib/theme";

/**
 * L'accueil, volontairement vide : son contenu reste à définir. Démarrer passe
 * par le bouton central, les routines par leur onglet, la file d'envoi par le
 * Profil.
 */
export default function Accueil() {
  return (
    <SafeAreaView style={styles.ecran} edges={["top"]}>
      <Text style={styles.titre}>better-lift</Text>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  ecran: { flex: 1, backgroundColor: couleurs.canvas, padding: espace.l },
  titre: { color: couleurs.encre, fontSize: taille.titre, fontWeight: "700" },
});
