import { routineASuivre } from "@better-lift/shared";
import { useInfiniteQuery, useQueries, useQuery } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { Plus } from "lucide-react-native";
import { useState } from "react";
import { FlatList, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Catalogue } from "../../../components/exercices/catalogue";
import { CarteRoutine } from "../../../components/routines/carte-routine";
import { Appuyable } from "../../../components/ui/appuyable";
import { Chargement, Erreur, Vide } from "../../../components/ui/etats";
import { Segments } from "../../../components/ui/segments";
import { optionsRoutine, optionsRoutines, optionsSeances } from "../../../lib/requetes";
import { affiche, creerStyles, espace, rayon, taille, useCouleurs } from "../../../lib/theme";

type Vue = "routines" | "exercices";

const VUES = [
  { valeur: "routines", libelle: "Mes routines" },
  { valeur: "exercices", libelle: "Exercices" },
] as const;

/**
 * L'onglet Routines (D121) : « Mes routines » et la bibliothèque d'exercices,
 * chacune avec toute la page. « À suivre » marque la routine qui vient après la
 * dernière faite.
 */
export default function Routines() {
  const styles = useStyles();
  const couleurs = useCouleurs();
  const router = useRouter();
  const [vue, setVue] = useState<Vue>("routines");

  return (
    <SafeAreaView style={styles.ecran} edges={["top"]}>
      <View style={styles.entete}>
        <Text style={styles.titre} accessibilityRole="header">
          Routines
        </Text>
        {/* Le mobile crée ses routines sans le web (D82). Secondaire : l'aplat
            de l'écran est le rond central. */}
        {vue === "routines" ? (
          <Appuyable
            onPress={() => router.push("/routine-edition")}
            style={({ pressed }) => [styles.nouvelle, pressed && styles.appuye]}
            accessibilityRole="button"
          >
            <Plus size={18} color={couleurs.encre} strokeWidth={2.4} />
            <Text style={styles.nouvelleTexte}>Nouvelle</Text>
          </Appuyable>
        ) : null}
      </View>
      <View style={styles.segments}>
        <Segments options={VUES} valeur={vue} onChange={setVue} />
      </View>
      {vue === "routines" ? <MesRoutines /> : <Catalogue />}
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
  segments: { paddingHorizontal: espace.l, paddingBottom: espace.m },
  liste: { paddingHorizontal: espace.l, paddingBottom: espace.xl },
}));
