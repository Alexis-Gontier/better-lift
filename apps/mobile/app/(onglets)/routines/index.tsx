import { dureeEstimeeSec, routineASuivre } from "@better-lift/shared";
import { useInfiniteQuery, useQueries, useQuery } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { ChevronRight, Plus } from "lucide-react-native";
import { FlatList, Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Chargement, Erreur, Vide } from "../../../components/ui/etats";
import { optionsRoutine, optionsRoutines, optionsSeances } from "../../../lib/requetes";
import { CIBLE, creerStyles, espace, rayon, taille, useCouleurs } from "../../../lib/theme";

const pluriel = (n: number, mot: string) => `${n} ${mot}${n > 1 ? "s" : ""}`;

/**
 * Les routines, en lignes à filets. « À suivre » marque celle qui vient après la
 * dernière faite (D110) ; la durée vient du détail, déjà en cache hors ligne.
 */
export default function Routines() {
  const styles = useStyles();
  const couleurs = useCouleurs();
  const router = useRouter();
  const routines = useQuery(optionsRoutines());
  const seances = useInfiniteQuery(optionsSeances());
  const details = useQueries({
    queries: (routines.data ?? []).map((r) => optionsRoutine(r.id)),
  });
  const suivante = routines.data
    ? routineASuivre(routines.data, seances.data?.pages.flatMap((p) => p.seances) ?? [])
    : null;

  return (
    <SafeAreaView style={styles.ecran} edges={["top"]}>
      <View style={styles.entete}>
        <Text style={styles.titre}>Routines</Text>
        {/* Le mobile crée ses routines sans le web (D82). Secondaire : l'écran
            n'a pas d'action principale, il mène aux routines. */}
        <Pressable
          onPress={() => router.push("/routine-edition")}
          style={({ pressed }) => [styles.nouvelle, pressed && styles.appuye]}
          accessibilityRole="button"
        >
          <Plus size={18} color={couleurs.encre} strokeWidth={2.4} />
          <Text style={styles.nouvelleTexte}>Nouvelle</Text>
        </Pressable>
      </View>
      {routines.isPending && routines.fetchStatus === "paused" ? (
        <Vide titre="Hors ligne" message="Les routines apparaîtront au retour du réseau." />
      ) : routines.isPending ? (
        <Chargement />
      ) : routines.isError && !routines.data ? (
        <Erreur
          message="Les routines n'ont pas pu se charger."
          onReessayer={() => routines.refetch()}
        />
      ) : routines.data.length === 0 ? (
        <Vide
          titre="Pas encore de routine."
          message="Crée-en une ici avec « Nouvelle », ou sur le web."
        />
      ) : (
        <FlatList
          data={routines.data}
          keyExtractor={(r) => r.id}
          refreshing={routines.isRefetching}
          onRefresh={() => routines.refetch()}
          renderItem={({ item, index }) => {
            const detail = details[index]?.data;
            const minutes = detail
              ? Math.max(1, Math.round(dureeEstimeeSec(detail.exercices) / 60))
              : null;
            return (
              <Pressable
                style={({ pressed }) => [styles.ligne, pressed && styles.appuye]}
                onPress={() => router.push(`/routines/${item.id}`)}
                accessibilityRole="button"
              >
                <View style={styles.texte}>
                  <View style={styles.nomLigne}>
                    <Text style={styles.nom} numberOfLines={1}>
                      {item.nom}
                    </Text>
                    {suivante?.id === item.id ? (
                      <View style={styles.puce}>
                        <Text style={styles.puceTexte}>À suivre</Text>
                      </View>
                    ) : null}
                  </View>
                  <Text style={styles.sous}>
                    {pluriel(item.nbExercices, "exercice")} · {pluriel(item.nbSeries, "série")}
                    {minutes ? ` · ≈ ${minutes} min` : ""}
                  </Text>
                </View>
                <ChevronRight size={20} color={couleurs.encreAttenuee} />
              </Pressable>
            );
          }}
        />
      )}
    </SafeAreaView>
  );
}

const useStyles = creerStyles((couleurs) => ({
  ecran: { flex: 1, backgroundColor: couleurs.canevas },
  entete: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: espace.l,
  },
  titre: { color: couleurs.encre, fontSize: taille.titre, fontWeight: "700" },
  nouvelle: {
    minHeight: 40,
    flexDirection: "row",
    alignItems: "center",
    gap: espace.xs,
    paddingHorizontal: espace.m,
    borderRadius: rayon.bouton,
    borderWidth: 1,
    borderColor: couleurs.ligneForte,
  },
  nouvelleTexte: { color: couleurs.encre, fontSize: taille.courant, fontWeight: "700" },
  ligne: {
    minHeight: CIBLE + 24,
    flexDirection: "row",
    alignItems: "center",
    gap: espace.m,
    paddingHorizontal: espace.l,
    borderBottomWidth: 1,
    borderBottomColor: couleurs.ligne,
  },
  appuye: { backgroundColor: couleurs.surface2 },
  texte: { flex: 1, gap: 4 },
  nomLigne: { flexDirection: "row", alignItems: "center", gap: espace.s },
  nom: { flexShrink: 1, color: couleurs.encre, fontSize: taille.courant + 2, fontWeight: "700" },
  sous: { color: couleurs.encreTertiaire, fontSize: taille.petit + 1 },
  // Une étiquette : contour neutre plein (D101).
  puce: {
    paddingHorizontal: espace.s,
    paddingVertical: 1,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: couleurs.ligneForte,
  },
  puceTexte: { color: couleurs.encreSecondaire, fontSize: 12, fontWeight: "600" },
}));
