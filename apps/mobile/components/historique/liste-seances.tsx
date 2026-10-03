import { useInfiniteQuery } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { FlatList, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { optionsSeances } from "../../lib/requetes";
import { CIBLE, creerStyles, espace, taille } from "../../lib/theme";
import { Chargement, Erreur, Vide } from "../ui/etats";
import { LigneSeance } from "./ligne-seance";

/**
 * Toutes les séances, antéchronologiques : l'écran Historique. L'Accueil en
 * montre le fil sous ses propres blocs (D110), avec la même ligne.
 */
export function ListeSeances({ titre }: { titre: string }) {
  const styles = useStyles();
  const _router = useRouter();
  const seances = useInfiniteQuery(optionsSeances());
  const liste = seances.data?.pages.flatMap((p) => p.seances) ?? [];

  return (
    <SafeAreaView style={styles.ecran} edges={["top"]}>
      <Text style={styles.titre}>{titre}</Text>
      {/* Hors ligne, la requête se met en pause au lieu d'échouer : sans ce cas,
          le chargement tournerait pour toujours. L'historique n'est pas gardé
          sur le téléphone (D96). */}
      {seances.isPending && seances.fetchStatus === "paused" ? (
        <Vide titre="Hors ligne" message="Tes séances s'afficheront au retour du réseau." />
      ) : seances.isPending ? (
        <Chargement />
      ) : seances.isError ? (
        <Erreur
          message="L'historique n'a pas pu être chargé."
          onReessayer={() => seances.refetch()}
        />
      ) : liste.length === 0 ? (
        <Vide
          titre="Aucune séance"
          message="Tes séances terminées apparaîtront ici, une fois envoyées."
        />
      ) : (
        <FlatList
          data={liste}
          keyExtractor={(s) => s.id}
          // Tirer pour rafraîchir : une séance envoyée depuis un autre appareil.
          refreshing={seances.isRefetching && !seances.isFetchingNextPage}
          onRefresh={() => seances.refetch()}
          onEndReached={() => seances.hasNextPage && seances.fetchNextPage()}
          onEndReachedThreshold={0.5}
          renderItem={({ item }) => <LigneSeance seance={item} />}
        />
      )}
    </SafeAreaView>
  );
}

const useStyles = creerStyles((couleurs) => ({
  ecran: { flex: 1, backgroundColor: couleurs.canevas },
  titre: {
    color: couleurs.encre,
    fontSize: taille.titre,
    fontWeight: "700",
    padding: espace.l,
  },
  ligne: {
    minHeight: CIBLE + 16,
    flexDirection: "row",
    alignItems: "center",
    gap: espace.m,
    paddingHorizontal: espace.l,
    borderBottomWidth: 1,
    borderBottomColor: couleurs.ligne,
  },
  appuye: { backgroundColor: couleurs.surface2 },
  nom: { color: couleurs.encre, fontSize: taille.courant },
  sous: { color: couleurs.encreAttenuee, fontSize: taille.petit, marginTop: 2 },
  chiffres: {
    color: couleurs.encreSecondaire,
    fontSize: taille.petit,
    fontVariant: ["tabular-nums"],
  },
}));
