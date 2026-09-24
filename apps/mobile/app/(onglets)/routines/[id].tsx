import { ABREGE_TYPE_SERIE, formaterCharge } from "@better-lift/shared";
import { useQuery } from "@tanstack/react-query";
import { useLocalSearchParams } from "expo-router";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { EnteteRetour } from "../../../components/ui/entete-retour";
import { Chargement, Erreur } from "../../../components/ui/etats";
import { useDemarrer } from "../../../lib/demarrer";
import { optionsRoutine } from "../../../lib/requetes";
import { CIBLE, couleurs, espace, taille } from "../../../lib/theme";
import { SYSTEME_UNITES } from "../../../lib/unites";

/** « 90 s », « 2 min », « 2 min 30 » : ce qu'on lit d'un coup d'œil. */
function formaterRepos(sec: number): string {
  if (sec < 60) return `${sec} s`;
  const min = Math.floor(sec / 60);
  const reste = sec % 60;
  return reste ? `${min} min ${String(reste).padStart(2, "0")}` : `${min} min`;
}

/** Le détail d'une routine, en lecture : l'édition reste sur le web (D49). */
export default function DetailRoutine() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const routine = useQuery(optionsRoutine(id));
  const { routine: demarrer, ouverture } = useDemarrer();

  if (routine.isPending || routine.isError) {
    return (
      <SafeAreaView style={styles.ecran} edges={["top"]}>
        <EnteteRetour titre="" />
        {routine.isPending ? (
          <Chargement />
        ) : (
          <Erreur
            message="Cette routine n'a pas pu être chargée."
            onReessayer={() => routine.refetch()}
          />
        )}
      </SafeAreaView>
    );
  }

  const r = routine.data;
  return (
    <SafeAreaView style={styles.ecran} edges={["top"]}>
      <EnteteRetour titre={r.nom} />
      <ScrollView contentContainerStyle={styles.contenu}>
        {/* L'action de l'écran : l'aplat lime (D28). */}
        <Pressable
          style={[styles.demarrer, ouverture !== null && { opacity: 0.6 }]}
          disabled={ouverture !== null}
          onPress={() => void demarrer(r.id)}
          accessibilityRole="button"
        >
          <Text style={styles.demarrerTexte}>
            {ouverture !== null ? "Ouverture…" : "Démarrer cette routine"}
          </Text>
        </Pressable>

        {r.exercices.map((ex, i) => (
          // L'index entre dans la clé : le même exercice peut figurer deux fois.
          <View key={`${ex.slug}-${i}`} style={styles.carte}>
            <View style={styles.entete}>
              <Text style={styles.exercice}>{ex.nom}</Text>
              {ex.reposSec ? (
                <Text style={styles.repos}>Repos {formaterRepos(ex.reposSec)}</Text>
              ) : null}
            </View>
            {ex.series.map((s, j) => (
              // Les séries n'ont pas d'identité propre : leur rang en tient lieu.
              <View key={j} style={styles.serie}>
                <Text style={styles.numero}>{j + 1}</Text>
                <Text style={styles.type}>{ABREGE_TYPE_SERIE[s.type]}</Text>
                <Text style={styles.valeur}>
                  {s.repsCible === null ? "—" : `${s.repsCible} reps`}
                </Text>
                <Text style={styles.valeur}>
                  {s.chargeCibleKg === null ? "—" : formaterCharge(s.chargeCibleKg, SYSTEME_UNITES)}
                </Text>
              </View>
            ))}
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  ecran: { flex: 1, backgroundColor: couleurs.canvas },
  contenu: { padding: espace.l, gap: espace.m, paddingBottom: espace.xl * 2 },
  demarrer: {
    minHeight: CIBLE + 8,
    borderRadius: 12,
    backgroundColor: couleurs.accent,
    alignItems: "center",
    justifyContent: "center",
  },
  demarrerTexte: { color: couleurs.surAccent, fontSize: taille.courant + 1, fontWeight: "700" },
  carte: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: couleurs.ligne,
    backgroundColor: couleurs.surface1,
    overflow: "hidden",
  },
  entete: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: espace.s,
    padding: espace.m,
    borderBottomWidth: 1,
    borderBottomColor: couleurs.ligne,
  },
  exercice: { flex: 1, color: couleurs.encre, fontSize: taille.courant, fontWeight: "600" },
  repos: { color: couleurs.encreFaible, fontSize: taille.petit },
  serie: {
    flexDirection: "row",
    alignItems: "center",
    gap: espace.m,
    paddingHorizontal: espace.m,
    paddingVertical: 10,
  },
  numero: { width: 18, color: couleurs.encreFaible, fontSize: taille.petit },
  type: { width: 22, color: couleurs.encrePale, fontSize: taille.petit },
  valeur: {
    flex: 1,
    color: couleurs.encreDouce,
    fontSize: taille.courant,
    fontVariant: ["tabular-nums"],
  },
});
