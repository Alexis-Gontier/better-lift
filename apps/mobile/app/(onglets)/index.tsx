import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { FlatList, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ASuivre } from "../../components/accueil/a-suivre";
import { CarteSeance } from "../../components/accueil/carte-seance";
import { Chargement, Erreur, Vide } from "../../components/ui/etats";
import { Section } from "../../components/ui/section";
import { optionsRoutines, optionsSeances } from "../../lib/requetes";
import { affiche, creerStyles, espace, taille } from "../../lib/theme";

/**
 * L'Accueil, « journal en tête » (D117, D119) : la routine à suivre, puis le
 * fil de TOUTES les séances, chacune relisible sans l'ouvrir. Démarrer vit au
 * centre de la barre (D120) ; « Cette semaine » est dans les Stats.
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
        renderItem={({ item }) => <CarteSeance seance={item} />}
        ItemSeparatorComponent={Intervalle}
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
            {liste.length > 0 ? <Section titre="Séances" style={styles.section} /> : null}
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

function Intervalle() {
  return <View style={{ height: espace.m }} />;
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
