import { Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Vide } from "../../components/ui/etats";
import { creerStyles, espace, taille } from "../../lib/theme";

/**
 * Les statistiques, réservées : l'onglet prend la place des Exercices dans la
 * barre, son contenu reste à dessiner.
 */
export default function Stats() {
  const styles = useStyles();
  return (
    <SafeAreaView style={styles.ecran} edges={["top"]}>
      <Text style={styles.titre}>Stats</Text>
      <Vide
        titre="Bientôt ici"
        message="Tes progrès séance après séance : volume, records, régularité."
      />
    </SafeAreaView>
  );
}

const useStyles = creerStyles((couleurs) => ({
  ecran: { flex: 1, backgroundColor: couleurs.canevas, padding: espace.l },
  titre: { color: couleurs.encre, fontSize: taille.titre, fontWeight: "700" },
}));
