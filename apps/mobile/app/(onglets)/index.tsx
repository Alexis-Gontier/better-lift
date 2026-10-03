import { useRouter } from "expo-router";
import { Play } from "lucide-react-native";
import { Pressable, Text } from "react-native";
import { ListeSeances } from "../../components/historique/liste-seances";
import { useSeance } from "../../lib/seance";
import { CIBLE, creerStyles, espace, taille, useCouleurs } from "../../lib/theme";

/**
 * L'Accueil est le fil des séances (D95), comme celui de Hevy. Il porte
 * « Démarrer », l'aplat de l'écran (D106) ; pendant une séance, c'est le
 * bandeau au-dessus de la barre qui la reprend (D107), et l'aplat disparaît.
 */
export default function Accueil() {
  const styles = useStyles();
  const couleurs = useCouleurs();
  const router = useRouter();
  const { seance } = useSeance();
  const demarrer = seance ? null : (
    <Pressable
      onPress={() => router.push("/demarrer")}
      style={({ pressed }) => [styles.demarrer, pressed && styles.appuye]}
      accessibilityRole="button"
    >
      <Play size={20} color={couleurs.surAction} strokeWidth={2.4} />
      <Text style={styles.demarrerTexte}>Démarrer une séance</Text>
    </Pressable>
  );
  return <ListeSeances titre="Accueil" action={demarrer} />;
}

const useStyles = creerStyles((couleurs) => ({
  demarrer: {
    minHeight: CIBLE + 4,
    marginHorizontal: espace.l,
    marginBottom: espace.m,
    borderRadius: 14,
    backgroundColor: couleurs.action,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: espace.s,
  },
  appuye: { opacity: 0.85 },
  demarrerTexte: { color: couleurs.surAction, fontSize: taille.courant, fontWeight: "700" },
}));
