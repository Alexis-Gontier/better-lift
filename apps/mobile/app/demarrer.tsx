import { routineASuivre } from "@better-lift/shared";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { Play, Plus } from "lucide-react-native";
import { ActivityIndicator, Pressable, ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Appuyable } from "../components/ui/appuyable";
import { useDemarrer } from "../lib/demarrer";
import { optionsRoutines, optionsSeances } from "../lib/requetes";
import { CIBLE, creerStyles, espace, rayon, taille, useCouleurs } from "../lib/theme";

const pluriel = (n: number, mot: string) => `${n} ${mot}${n > 1 ? "s" : ""}`;

/**
 * Démarrer, en feuille basse (D111) : une séance vide, ou une routine — celle
 * « À suivre » marquée. Le voile et le geste de retour la ferment.
 */
export default function Demarrer() {
  const styles = useStyles();
  const couleurs = useCouleurs();
  const router = useRouter();
  const { bottom } = useSafeAreaInsets();
  const routines = useQuery(optionsRoutines());
  const seances = useInfiniteQuery(optionsSeances());
  const { vide, routine, ouverture } = useDemarrer({ depuisModale: true });
  const suivante = routines.data
    ? routineASuivre(routines.data, seances.data?.pages.flatMap((p) => p.seances) ?? [])
    : null;
  // Ouverte sans historique (lien direct, reprise de l'app), le retour n'aurait
  // nulle part où aller : on retombe sur l'Accueil.
  const fermer = () => (router.canGoBack() ? router.back() : router.replace("/"));

  return (
    <View style={styles.racine}>
      <Pressable style={styles.voile} onPress={fermer} accessibilityLabel="Fermer" />
      <View style={[styles.feuille, { paddingBottom: espace.l + bottom }]}>
        <View style={styles.poignee} />
        <Text style={styles.titre} accessibilityRole="header">
          Démarrer
        </Text>

        <Appuyable
          style={({ pressed }) => [styles.ligne, pressed && styles.appuye]}
          onPress={() => void vide()}
          accessibilityRole="button"
        >
          <View style={styles.icone}>
            <Plus size={20} color={couleurs.encre} />
          </View>
          <View style={styles.texte}>
            <Text style={styles.nom}>Séance vide</Text>
            <Text style={styles.pale}>Ajoute tes exercices au fil de la séance.</Text>
          </View>
        </Appuyable>

        <Text style={styles.section} accessibilityRole="header">
          Routines
        </Text>
        <ScrollView style={styles.liste}>
          {/* Hors ligne et sans cache, la requête se met en pause : sans ce cas,
              l'indicateur tournerait pour toujours. */}
          {routines.isPending && routines.fetchStatus === "paused" ? (
            <Text style={styles.message}>
              Hors ligne : les routines apparaîtront au retour du réseau.
            </Text>
          ) : routines.isPending ? (
            <ActivityIndicator color={couleurs.encreTertiaire} style={styles.attente} />
          ) : routines.isError && !routines.data ? (
            <Appuyable onPress={() => routines.refetch()} accessibilityRole="button">
              <Text style={styles.message}>Routines indisponibles pour l'instant. Réessayer</Text>
            </Appuyable>
          ) : routines.data.length === 0 ? (
            <Text style={styles.message}>
              Pas encore de routine. Crée-en une ici ou sur le web.
            </Text>
          ) : (
            // La plus probable en tête : la routine « À suivre », puis les autres.
            [...routines.data]
              .sort((a, b) => Number(b.id === suivante?.id) - Number(a.id === suivante?.id))
              .map((r) => (
                <Appuyable
                  key={r.id}
                  style={({ pressed }) => [
                    styles.ligne,
                    (pressed || ouverture === r.id) && styles.appuye,
                  ]}
                  disabled={ouverture !== null}
                  onPress={() => void routine(r.id)}
                  accessibilityRole="button"
                >
                  <View style={styles.icone}>
                    {ouverture === r.id ? (
                      <ActivityIndicator size="small" color={couleurs.encre} />
                    ) : (
                      <Play size={18} color={couleurs.encre} />
                    )}
                  </View>
                  <View style={styles.texte}>
                    <Text style={styles.nom} numberOfLines={1}>
                      {r.nom}
                    </Text>
                    <Text style={styles.pale}>
                      {pluriel(r.nbExercices, "exercice")} · {pluriel(r.nbSeries, "série")}
                    </Text>
                  </View>
                  {suivante?.id === r.id ? (
                    <View style={styles.puce}>
                      <Text style={styles.puceTexte}>À suivre</Text>
                    </View>
                  ) : null}
                </Appuyable>
              ))
          )}
        </ScrollView>
      </View>
    </View>
  );
}

const useStyles = creerStyles((couleurs) => ({
  racine: { flex: 1, justifyContent: "flex-end" },
  voile: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: couleurs.voile,
  },
  feuille: {
    maxHeight: "85%",
    paddingTop: espace.s,
    paddingHorizontal: espace.l,
    borderTopLeftRadius: rayon.feuille,
    borderTopRightRadius: rayon.feuille,
    backgroundColor: couleurs.surface2,
  },
  poignee: {
    alignSelf: "center",
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: couleurs.ligneForte,
    marginBottom: espace.m,
  },
  titre: {
    color: couleurs.encre,
    fontSize: 22,
    fontWeight: "700",
    marginBottom: espace.s,
  },
  section: {
    color: couleurs.encreAttenuee,
    fontSize: 12,
    fontWeight: "600",
    letterSpacing: 0.8,
    textTransform: "uppercase",
    marginTop: espace.l,
    marginBottom: espace.xs,
  },
  liste: { flexGrow: 0 },
  ligne: {
    minHeight: 60,
    flexDirection: "row",
    alignItems: "center",
    gap: espace.m,
    paddingHorizontal: espace.xs,
    borderRadius: rayon.bouton,
  },
  appuye: { backgroundColor: couleurs.surface3 },
  icone: {
    width: CIBLE - 8,
    height: CIBLE - 8,
    borderRadius: rayon.cellule,
    borderWidth: 1,
    borderColor: couleurs.ligneForte,
    alignItems: "center",
    justifyContent: "center",
  },
  texte: { flex: 1 },
  nom: { color: couleurs.encre, fontSize: taille.courant, fontWeight: "700" },
  pale: { color: couleurs.encreTertiaire, fontSize: taille.petit },
  message: { color: couleurs.encreTertiaire, fontSize: taille.petit, paddingVertical: espace.l },
  attente: { marginVertical: espace.xl },
  // Une étiquette : contour neutre plein (D101).
  puce: {
    paddingHorizontal: espace.s,
    paddingVertical: 2,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: couleurs.ligneForte,
  },
  puceTexte: { color: couleurs.encreSecondaire, fontSize: 12, fontWeight: "600" },
}));
