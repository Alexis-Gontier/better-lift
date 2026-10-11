import { routineASuivre } from "@better-lift/shared";
import { useInfiniteQuery, useQueries, useQuery } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { Plus } from "lucide-react-native";
import { FlatList, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { CarteRoutine } from "../../../components/routines/carte-routine";
import { Appuyable } from "../../../components/ui/appuyable";
import { Chargement, Erreur, Vide } from "../../../components/ui/etats";
import { optionsRoutine, optionsRoutines, optionsSeances } from "../../../lib/requetes";
import { affiche, creerStyles, espace, rayon, taille, useCouleurs } from "../../../lib/theme";

/**
 * L'onglet Routines (D171) : une liste, sans onglet dans l'onglet — le catalogue
 * complet ne vit plus que dans « Choisir des exercices ». La carte ouvre la
 * routine ; le rond central lance. « À suivre » marque celle qui vient après la
 * dernière faite.
 */
export default function Routines() {
  const styles = useStyles();
  const couleurs = useCouleurs();
  const router = useRouter();

  return (
    <SafeAreaView style={styles.ecran} edges={["top"]}>
      <View style={styles.entete}>
        <Text style={styles.titre} accessibilityRole="header">
          Routines
        </Text>
        {/* Le mobile crée ses routines sans le web (D82). Secondaire : l'aplat
            de l'écran est le rond central. */}
        <Appuyable
          onPress={() => router.push("/routine-edition")}
          style={({ pressed }) => [styles.nouvelle, pressed && styles.appuye]}
          accessibilityRole="button"
        >
          <Plus size={18} color={couleurs.encre} strokeWidth={2.4} />
          <Text style={styles.nouvelleTexte}>Nouvelle</Text>
        </Appuyable>
      </View>
      <MesRoutines />
    </SafeAreaView>
  );
}

function MesRoutines() {
  const styles = useStyles();
  const routines = useQuery(optionsRoutines());
  const seances = useInfiniteQuery(optionsSeances());
  // Les détails sont en cache (préchargés pour le hors ligne) : noms et durée sans attente.
  const details = useQueries({
    queries: (routines.data ?? []).map((r) => optionsRoutine(r.id)),
  });
  const suivante = routines.data
    ? routineASuivre(routines.data, seances.data?.pages.flatMap((p) => p.seances) ?? [])
    : null;

  if (routines.isPending && routines.fetchStatus === "paused") {
    return <Vide titre="Hors ligne" message="Les routines apparaîtront au retour du réseau." />;
  }
  if (routines.isPending) return <Chargement />;
  if (routines.isError && !routines.data) {
    return (
      <Erreur
        message="Les routines n'ont pas pu se charger."
        onReessayer={() => routines.refetch()}
      />
    );
  }
  if (routines.data.length === 0) {
    return (
      <Vide
        titre="Pas encore de routine."
        message="Crée-en une ici avec « Nouvelle », ou sur le web."
      />
    );
  }
  return (
    <FlatList
      data={routines.data}
      keyExtractor={(r) => r.id}
      refreshing={routines.isRefetching}
      onRefresh={() => routines.refetch()}
      contentContainerStyle={styles.liste}
      ItemSeparatorComponent={Intervalle}
      renderItem={({ item, index }) => (
        <CarteRoutine
          routine={item}
          detail={details[index]?.data}
          aSuivre={suivante?.id === item.id}
        />
      )}
    />
  );
}

function Intervalle() {
  return <View style={{ height: espace.m }} />;
}

const useStyles = creerStyles((couleurs) => ({
  ecran: { flex: 1, backgroundColor: couleurs.canevas },
  entete: {
    minHeight: 72,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: espace.l,
    paddingTop: espace.s,
  },
  titre: { ...affiche, color: couleurs.encre, fontSize: taille.titre },
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
  appuye: { backgroundColor: couleurs.surface2 },
  liste: { paddingHorizontal: espace.l, paddingBottom: espace.xl },
}));
