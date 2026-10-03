import { formaterCharge, formatJour } from "@better-lift/shared";
import { useInfiniteQuery } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import type { ReactNode } from "react";
import { FlatList, Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { FUSEAU } from "../../lib/fuseau";
import { optionsSeances } from "../../lib/requetes";
import { dureeMin } from "../../lib/temps";
import { CIBLE, creerStyles, espace, taille } from "../../lib/theme";
import { SYSTEME_UNITES } from "../../lib/unites";
import { Chargement, Erreur, Vide } from "../ui/etats";

/**
 * Le fil des séances, antéchronologique (D95) : l'Accueil le montre, l'écran
 * Historique aussi. Le détail s'ouvre dans la pile de l'historique.
 */
export function ListeSeances({ titre, action }: { titre: string; action?: ReactNode }) {
  const styles = useStyles();
  const router = useRouter();
  const seances = useInfiniteQuery(optionsSeances());
  const liste = seances.data?.pages.flatMap((p) => p.seances) ?? [];

  return (
    <SafeAreaView style={styles.ecran} edges={["top"]}>
      <Text style={styles.titre}>{titre}</Text>
      {action}
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
          renderItem={({ item }) => (
            <Pressable
              style={({ pressed }) => [styles.ligne, pressed && styles.appuye]}
              onPress={() => router.push(`/historique/${item.id}`)}
              accessibilityRole="button"
            >
              <View style={{ flex: 1 }}>
                <Text style={styles.nom} numberOfLines={1}>
                  {item.nom}
                </Text>
                {/* Le jour dans le fuseau de l'utilisateur, jamais en UTC (D66). */}
                <Text style={styles.sous}>{formatJour(item.debut, FUSEAU)}</Text>
              </View>
              <Text style={styles.chiffres}>
                {dureeMin(item)} min · {formaterCharge(item.volumeKg, SYSTEME_UNITES)}
              </Text>
            </Pressable>
          )}
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
