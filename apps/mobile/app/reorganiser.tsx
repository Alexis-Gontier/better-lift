import { deplacerExercice, type ExerciceEnCours } from "@better-lift/shared";
import { useRouter } from "expo-router";
import { GripVertical } from "lucide-react-native";
import { Text, View } from "react-native";
import DraggableFlatList, { ScaleDecorator } from "react-native-draggable-flatlist";
import { SafeAreaView } from "react-native-safe-area-context";
import { Appuyable } from "../components/ui/appuyable";
import { useSeance } from "../lib/seance";
import { creerStyles, espace, taille, useCouleurs } from "../lib/theme";

/** Une clé stable par exercice, même quand le même mouvement revient deux fois. */
function avecCles(exercices: ExerciceEnCours[]) {
  const vus = new Map<string, number>();
  return exercices.map((e, i) => {
    const n = (vus.get(e.slug) ?? 0) + 1;
    vus.set(e.slug, n);
    return { cle: `${e.slug}#${n}`, i, e };
  });
}

/**
 * Réorganiser les exercices de la séance (D89) : une liste compacte, sans les
 * séries, où l'on glisse un exercice par sa poignée — ou par un appui long.
 * Chaque dépôt s'écrit aussitôt dans le brouillon.
 */
export default function Reorganiser() {
  const styles = useStyles();
  const couleurs = useCouleurs();
  const router = useRouter();
  const { seance, modifier } = useSeance();
  if (!seance) return <SafeAreaView style={styles.ecran} />;

  return (
    <SafeAreaView style={styles.ecran} edges={["top", "bottom"]}>
      <View style={styles.entete}>
        <Text style={styles.titre} accessibilityRole="header">
          Réorganiser
        </Text>
        <Appuyable
          onPress={() => router.back()}
          hitSlop={8}
          style={styles.ok}
          accessibilityRole="button"
        >
          <Text style={styles.okTexte}>OK</Text>
        </Appuyable>
      </View>
      <Text style={styles.aide}>Glisse un exercice par sa poignée pour le déplacer.</Text>
      <DraggableFlatList
        data={avecCles(seance.exercices)}
        keyExtractor={(x) => x.cle}
        onDragEnd={({ from, to }) => modifier(deplacerExercice(seance, from, to))}
        contentContainerStyle={styles.liste}
        renderItem={({ item, drag, isActive }) => (
          <ScaleDecorator>
            <Appuyable
              onLongPress={drag}
              delayLongPress={200}
              disabled={isActive}
              style={[styles.ligne, isActive && styles.active]}
            >
              <Text style={styles.nom} numberOfLines={1}>
                {item.e.nom}
              </Text>
              <Text style={styles.series}>
                {item.e.series.length} {item.e.series.length > 1 ? "séries" : "série"}
              </Text>
              <Appuyable
                onPressIn={drag}
                hitSlop={8}
                style={styles.poignee}
                accessibilityLabel={`Déplacer ${item.e.nom}`}
              >
                <GripVertical size={20} color={couleurs.encreTertiaire} />
              </Appuyable>
            </Appuyable>
          </ScaleDecorator>
        )}
      />
    </SafeAreaView>
  );
}

const useStyles = creerStyles((couleurs) => ({
  ecran: { flex: 1, backgroundColor: couleurs.canevas },
  entete: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: espace.l,
    paddingVertical: espace.m,
  },
  titre: { flex: 1, color: couleurs.encre, fontSize: taille.grand, fontWeight: "700" },
  // L'action de l'écran : l'aplat lime (D28), compact (D88).
  ok: {
    height: 36,
    paddingHorizontal: espace.l,
    borderRadius: 8,
    backgroundColor: couleurs.action,
    justifyContent: "center",
  },
  okTexte: { color: couleurs.surAction, fontSize: 15, fontWeight: "700" },
  aide: {
    color: couleurs.encreTertiaire,
    fontSize: taille.petit,
    paddingHorizontal: espace.l,
    marginBottom: espace.s,
  },
  liste: { paddingHorizontal: espace.m, paddingBottom: espace.l },
  ligne: {
    minHeight: 52,
    flexDirection: "row",
    alignItems: "center",
    gap: espace.m,
    paddingLeft: espace.m,
    marginBottom: espace.s,
    borderRadius: 10,
    backgroundColor: couleurs.surface1,
    borderWidth: 1,
    borderColor: couleurs.ligne,
  },
  active: { backgroundColor: couleurs.surface3, borderColor: couleurs.ligneForte },
  nom: { flex: 1, color: couleurs.encre, fontSize: taille.courant, fontWeight: "600" },
  series: { color: couleurs.encreTertiaire, fontSize: taille.petit },
  poignee: { width: 44, height: 52, alignItems: "center", justifyContent: "center" },
}));
