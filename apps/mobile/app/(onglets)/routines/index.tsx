import { useQuery } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { ChevronRight } from "lucide-react-native";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Chargement, Erreur, Vide } from "../../../components/ui/etats";
import { optionsRoutines } from "../../../lib/requetes";
import { CIBLE, couleurs, espace, taille } from "../../../lib/theme";

const pluriel = (n: number, mot: string) => `${n} ${mot}${n > 1 ? "s" : ""}`;

export default function Routines() {
  const router = useRouter();
  const routines = useQuery(optionsRoutines());

  return (
    <SafeAreaView style={styles.ecran} edges={["top"]}>
      <Text style={styles.titre}>Routines</Text>
      {routines.isPending ? (
        <Chargement />
      ) : routines.isError ? (
        <Erreur
          message="Les routines n'ont pas pu être chargées."
          onReessayer={() => routines.refetch()}
        />
      ) : routines.data.length === 0 ? (
        <Vide titre="Aucune routine" message="Prépare-en une sur le web, elle apparaîtra ici." />
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
              <ChevronRight size={20} color={couleurs.encreFaible} />
            </Pressable>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  ecran: { flex: 1, backgroundColor: couleurs.canvas },
  titre: { color: couleurs.encre, fontSize: taille.titre, fontWeight: "700", padding: espace.l },
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
  sous: { color: couleurs.encrePale, fontSize: taille.petit },
});
