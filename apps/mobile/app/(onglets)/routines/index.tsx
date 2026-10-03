import { useQuery } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { ChevronRight, Plus } from "lucide-react-native";
import { FlatList, Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Chargement, Erreur, Vide } from "../../../components/ui/etats";
import { optionsRoutines } from "../../../lib/requetes";
import { CIBLE, creerStyles, espace, taille, useCouleurs } from "../../../lib/theme";

const pluriel = (n: number, mot: string) => `${n} ${mot}${n > 1 ? "s" : ""}`;

export default function Routines() {
  const styles = useStyles();
  const couleurs = useCouleurs();
  const router = useRouter();
  const routines = useQuery(optionsRoutines());

  return (
    <SafeAreaView style={styles.ecran} edges={["top"]}>
      <View style={styles.entete}>
        <Text style={styles.titre}>Routines</Text>
        {/* Le mobile crée ses routines sans le web (D82). */}
        <Pressable
          onPress={() => router.push("/routine-edition")}
          style={styles.nouvelle}
          accessibilityRole="button"
        >
          <Plus size={18} color={couleurs.surAction} strokeWidth={2.5} />
          <Text style={styles.nouvelleTexte}>Nouvelle</Text>
        </Pressable>
      </View>
      {routines.isPending ? (
        <Chargement />
      ) : routines.isError && !routines.data ? (
        <Erreur
          message="Les routines n'ont pas pu être chargées."
          onReessayer={() => routines.refetch()}
        />
      ) : routines.data.length === 0 ? (
        <Vide titre="Aucune routine" message="Crée ta première avec « Nouvelle »." />
      ) : (
        <FlatList
          data={routines.data}
          keyExtractor={(r) => r.id}
          contentContainerStyle={styles.liste}
          refreshing={routines.isRefetching}
          onRefresh={() => routines.refetch()}
          renderItem={({ item }) => (
            <Pressable
              style={({ pressed }) => [styles.carte, pressed && styles.appuye]}
              onPress={() => router.push(`/routines/${item.id}`)}
              accessibilityRole="button"
            >
              <View style={{ flex: 1, gap: 4 }}>
                <Text style={styles.nom}>{item.nom}</Text>
                <Text style={styles.sous}>
                  {pluriel(item.nbExercices, "exercice")} · {pluriel(item.nbSeries, "série")}
                </Text>
              </View>
              <ChevronRight size={20} color={couleurs.encreAttenuee} />
            </Pressable>
          )}
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
  // L'action de l'écran : l'aplat lime (D28).
  nouvelle: {
    minHeight: 40,
    flexDirection: "row",
    alignItems: "center",
    gap: espace.xs,
    paddingHorizontal: espace.m,
    borderRadius: 999,
    backgroundColor: couleurs.action,
  },
  nouvelleTexte: { color: couleurs.surAction, fontSize: taille.courant, fontWeight: "700" },
  liste: { paddingHorizontal: espace.l, gap: espace.m, paddingBottom: espace.xl },
  carte: {
    minHeight: CIBLE + 24,
    flexDirection: "row",
    alignItems: "center",
    padding: espace.l,
    borderRadius: 12,
    backgroundColor: couleurs.surface1,
    borderWidth: 1,
    borderColor: couleurs.ligne,
  },
  appuye: { backgroundColor: couleurs.surface2 },
  nom: { color: couleurs.encre, fontSize: taille.courant + 1, fontWeight: "600" },
  sous: { color: couleurs.encreTertiaire, fontSize: taille.petit },
}));
