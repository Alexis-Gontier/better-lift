import { reposRestant, secondesEcoulees } from "@better-lift/shared";
import { useRouter } from "expo-router";
import { ChevronUp } from "lucide-react-native";
import { Pressable, Text, View } from "react-native";
import { useSeance } from "../lib/seance";
import { formaterDuree, useMaintenant } from "../lib/temps";
import { CIBLE, creerStyles, espace, polices, taille, useCouleurs } from "../lib/theme";

/**
 * La séance en cours, joignable en un geste depuis n'importe quel onglet (D107).
 *
 * NEUTRE, sans lime : l'écran garde son seul aplat (D105). Tout le bandeau est
 * appuyable. Il dit le repos qui tourne s'il y en a un, le chrono sinon — les
 * deux se déduisent d'heures stockées, jamais d'un compteur (§ 8).
 */
export function BandeauSeance() {
  const { seance } = useSeance();
  return seance ? <Contenu /> : null;
}

// À part : l'horloge ne tourne que lorsqu'une séance est en cours.
function Contenu() {
  const styles = useStyles();
  const couleurs = useCouleurs();
  const router = useRouter();
  const { seance } = useSeance();
  const maintenant = useMaintenant();
  if (!seance) return null;

  const repos = reposRestant(seance, maintenant);
  const temps =
    repos !== null && repos > 0
      ? `Repos ${formaterDuree(repos)}`
      : formaterDuree(secondesEcoulees(seance.debut, maintenant));

  return (
    <Pressable
      onPress={() => router.push("/seance")}
      style={({ pressed }) => [styles.bandeau, pressed && styles.appuye]}
      accessibilityRole="button"
      accessibilityLabel={`Reprendre la séance ${seance.nom}, ${temps}`}
    >
      <View style={styles.texte}>
        <Text style={styles.nom} numberOfLines={1}>
          {seance.nom}
        </Text>
        <Text style={styles.temps}>{temps}</Text>
      </View>
      <Text style={styles.reprendre}>Reprendre</Text>
      <ChevronUp size={20} color={couleurs.encreSecondaire} />
    </Pressable>
  );
}

const useStyles = creerStyles((couleurs) => ({
  bandeau: {
    minHeight: CIBLE + 8,
    marginHorizontal: espace.s,
    marginBottom: espace.s,
    paddingHorizontal: espace.l,
    flexDirection: "row",
    alignItems: "center",
    gap: espace.m,
    borderRadius: 18,
    backgroundColor: couleurs.surface3,
    borderWidth: 1,
    borderColor: couleurs.ligneForte,
  },
  appuye: { backgroundColor: couleurs.surface2 },
  texte: { flex: 1, gap: 2 },
  nom: { color: couleurs.encre, fontSize: taille.courant, fontWeight: "700" },
  temps: {
    color: couleurs.encreSecondaire,
    fontSize: taille.petit + 1,
    fontFamily: polices.condense,
    fontVariant: ["tabular-nums"],
  },
  reprendre: { color: couleurs.encre, fontSize: taille.petit + 1, fontWeight: "600" },
}));
