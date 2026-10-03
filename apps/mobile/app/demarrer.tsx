import { useQuery } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { X } from "lucide-react-native";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useDemarrer } from "../lib/demarrer";
import { optionsRoutines } from "../lib/requetes";
import { CIBLE, couleurs, espace, taille } from "../lib/theme";

const pluriel = (n: number, mot: string) => `${n} ${mot}${n > 1 ? "s" : ""}`;

/**
 * L'écran du bouton central : choisir comment démarrer. Il FLOTTE (modale),
 * donc il se ferme — croix en haut, ou geste de retour.
 */
export default function Demarrer() {
  const router = useRouter();
  const routines = useQuery(optionsRoutines());
  const { vide, routine, ouverture } = useDemarrer({ depuisModale: true });

  return (
    <SafeAreaView style={styles.ecran}>
      <View style={styles.entete}>
        <Text style={styles.titre}>Démarrer une séance</Text>
        <Pressable
          // Ouvert sans historique (lien direct, reprise de l'app), le retour
          // n'aurait nulle part où aller : on retombe sur l'accueil.
          onPress={() => (router.canGoBack() ? router.back() : router.replace("/"))}
          style={styles.fermer}
          accessibilityRole="button"
          accessibilityLabel="Fermer"
        >
          <X size={26} color={couleurs.encre} />
        </Pressable>
      </View>
      <ScrollView contentContainerStyle={styles.contenu}>
        {/* L'action principale : l'aplat lime (D28). */}
        <Pressable style={styles.vide} onPress={() => void vide()} accessibilityRole="button">
          <Text style={styles.videTexte}>Séance vide</Text>
        </Pressable>

        <Text style={styles.section}>Depuis une routine</Text>
        {/* Hors ligne et sans cache, la requête se met en pause : sans ce cas,
            l'indicateur tournerait pour toujours. */}
        {routines.isPending && routines.fetchStatus === "paused" ? (
          <Text style={styles.pale}>
            Hors ligne : les routines apparaîtront au retour du réseau.
          </Text>
        ) : routines.isPending ? (
          <ActivityIndicator color={couleurs.encrePale} style={{ marginVertical: espace.xl }} />
        ) : routines.isError && !routines.data ? (
          <Pressable onPress={() => routines.refetch()} style={styles.routine}>
            <Text style={styles.pale}>Les routines n'ont pas pu être chargées. Réessayer</Text>
          </Pressable>
        ) : routines.data.length === 0 ? (
          <Text style={styles.pale}>Aucune routine. Prépare-en une sur le web.</Text>
        ) : (
          routines.data.map((r) => (
            <Pressable
              key={r.id}
              style={[styles.routine, ouverture === r.id && { opacity: 0.6 }]}
              disabled={ouverture !== null}
              onPress={() => void routine(r.id)}
              accessibilityRole="button"
            >
              <Text style={styles.routineNom}>{r.nom}</Text>
              <Text style={styles.pale}>
                {pluriel(r.nbExercices, "exercice")} · {pluriel(r.nbSeries, "série")}
              </Text>
            </Pressable>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  ecran: { flex: 1, backgroundColor: couleurs.canvas },
  entete: {
    flexDirection: "row",
    alignItems: "center",
    paddingLeft: espace.l,
    paddingRight: espace.s,
    paddingVertical: espace.s,
  },
  titre: { flex: 1, color: couleurs.encre, fontSize: taille.grand, fontWeight: "700" },
  fermer: { width: CIBLE, height: CIBLE, alignItems: "center", justifyContent: "center" },
  contenu: { padding: espace.l, gap: espace.m },
  vide: {
    minHeight: CIBLE + 12,
    borderRadius: 12,
    backgroundColor: couleurs.accent,
    alignItems: "center",
    justifyContent: "center",
  },
  videTexte: { color: couleurs.surAccent, fontSize: taille.courant + 1, fontWeight: "700" },
  section: {
    color: couleurs.encrePale,
    fontSize: taille.petit,
    textTransform: "uppercase",
    marginTop: espace.m,
  },
  routine: {
    padding: espace.l,
    borderRadius: 12,
    backgroundColor: couleurs.surface1,
    borderWidth: 1,
    borderColor: couleurs.ligne,
    gap: 4,
  },
  routineNom: { color: couleurs.encre, fontSize: taille.courant + 1, fontWeight: "600" },
  pale: { color: couleurs.encrePale, fontSize: taille.petit },
});
