import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { FlatList, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ASuivre } from "../../components/accueil/a-suivre";
import { CetteSemaine } from "../../components/accueil/cette-semaine";
import { LigneSeance } from "../../components/accueil/ligne-seance";
import { Chargement, Erreur, Vide } from "../../components/ui/etats";
import { Section } from "../../components/ui/section";
import { optionsRoutines, optionsSeances } from "../../lib/requetes";
import { affiche, creerStyles, espace, taille } from "../../lib/theme";

/**
 * L'Accueil, tableau de la semaine (D166) : la prochaine séance, où j'en suis
 * cette semaine, puis le journal — une ligne par séance, le détail à un appui.
 * Démarrer vit au centre de la barre (D165).
 */
export default function Accueil() {
  const styles = useStyles();
  const seances = useInfiniteQuery(optionsSeances());
  const routines = useQuery(optionsRoutines());
  const liste = seances.data?.pages.flatMap((p) => p.seances) ?? [];

  return (
    <SafeAreaView style={styles.ecran} edges={["top"]}>
      <FlatList
        data={liste}
        keyExtractor={(s) => s.id}
        renderItem={({ item }) => <LigneSeance seance={item} />}
        // Tirer pour rafraîchir : une séance envoyée depuis un autre appareil.
        refreshing={seances.isRefetching && !seances.isFetchingNextPage}
        onRefresh={() => seances.refetch()}
        onEndReached={() => seances.hasNextPage && seances.fetchNextPage()}
        onEndReachedThreshold={0.5}
        contentContainerStyle={styles.contenu}
        ListHeaderComponent={
          <View style={styles.entete}>
            <Text style={styles.titre} accessibilityRole="header">
              Accueil
            </Text>
            <ASuivre routines={routines.data ?? null} seances={liste} />
            <CetteSemaine />
            {liste.length > 0 ? <Section titre="Journal" style={styles.section} /> : null}
          </View>
        }
        ListEmptyComponent={
          // Hors ligne, la requête se met en pause au lieu d'échouer :
          // l'historique n'est pas gardé sur le téléphone (D96).
          seances.isPending && seances.fetchStatus === "paused" ? (
            <Vide titre="Hors ligne" message="Tes séances s'afficheront au retour du réseau." />
          ) : seances.isPending ? (
            <Chargement />
          ) : seances.isError ? (
            <Erreur
              message="L'historique n'a pas pu se charger."
              onReessayer={() => seances.refetch()}
            />
          ) : null
        }
      />
    </SafeAreaView>
  );
}

const useStyles = creerStyles((couleurs) => ({
  ecran: { flex: 1, backgroundColor: couleurs.canevas },
  contenu: { paddingHorizontal: espace.l, paddingBottom: espace.xl },
  entete: { gap: espace.m, paddingBottom: espace.m },
  titre: {
    ...affiche,
    color: couleurs.encre,
    fontSize: taille.titre,
    paddingTop: espace.l,
  },
  section: { marginTop: espace.m },
}));
