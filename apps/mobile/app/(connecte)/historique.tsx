import { formaterCharge, formatMois, parMois, type SeanceFil } from "@better-lift/shared";
import { useInfiniteQuery } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import type { ReactNode } from "react";
import { ActivityIndicator, SectionList, View } from "react-native";
import { CarteSeance, filEnAttente } from "@/components/historique/carte-seance";
import { Ecran } from "@/components/ui/ecran";
import { Chargement, Erreur, Vide } from "@/components/ui/etats";
import { Text } from "@/components/ui/text";
import { TitreOnglet } from "@/components/ui/titre-onglet";
import { FUSEAU } from "@/lib/fuseau";
import { optionsSeances } from "@/lib/requetes";
import { useSeance } from "@/lib/seance";
import { SYSTEME_UNITES } from "@/lib/unites";

const majuscule = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

/**
 * L'onglet Historique (D319, D345), comme celui du web : les séances, la plus récente en haut,
 * groupées par mois, lues page par page en défilant. Une séance terminée qui attend le
 * réseau vient en tête, « En attente d'envoi ». La liste n'est pas gardée hors ligne
 * (D96 : elle grossit sans fin).
 */
export default function Historique() {
  const router = useRouter();
  const requete = useInfiniteQuery(optionsSeances());
  const { file } = useSeance();
  const seances = requete.data?.pages.flatMap((p) => p.seances) ?? [];
  // Une séance envoyée sort de la file APRÈS la réponse : le temps de la relecture, elle
  // serait deux fois dans la liste.
  const recues = new Set(seances.map((s) => s.id));
  const enAttente = file
    .filter((e) => e.erreur === null && !recues.has(e.seance.id))
    .map(filEnAttente)
    .reverse();

  const attente = enAttente.length > 0 && (
    <View className="gap-2 px-4 pb-4">
      {enAttente.map((s) => (
        <CarteSeance key={s.id} seance={s} enAttente />
      ))}
    </View>
  );
  // Un état d'écran, sous les séances en attente s'il y en a.
  const etat = (contenu: ReactNode) => (
    <>
      {attente}
      {contenu}
    </>
  );

  const corps = () => {
    if (requete.isPending && requete.fetchStatus === "paused") {
      return etat(
        <Vide titre="Hors ligne" message="L'historique apparaîtra au retour du réseau." />,
      );
    }
    if (requete.isPending) return <Chargement forme="historique" />;
    if (requete.isError && !requete.data) {
      return etat(
        <Erreur
          message="L'historique n'a pas pu se charger."
          onReessayer={() => requete.refetch()}
        />,
      );
    }
    if (seances.length === 0 && enAttente.length === 0) {
      return (
        <Vide titre="Pas encore de séance" message="Tes séances terminées apparaîtront ici." />
      );
    }

    const sections = parMois(seances, FUSEAU).map((g) => ({ mois: g.mois, data: g.seances }));
    return (
      <SectionList<SeanceFil, { mois: string }>
        className="flex-1"
        contentContainerClassName="pb-4"
        sections={sections}
        keyExtractor={(s) => s.id}
        stickySectionHeadersEnabled={false}
        ListHeaderComponent={attente || null}
        renderSectionHeader={({ section }) => (
          <View className="flex-row items-baseline justify-between px-4 pt-2 pb-2">
            <Text className="font-medium" accessibilityRole="header">
              {majuscule(formatMois(section.mois))}
            </Text>
            <Text className="text-muted-foreground text-sm tabular-nums">
              {section.data.length > 1 ? `${section.data.length} séances` : "1 séance"} ·{" "}
              {formaterCharge(
                Math.round(section.data.reduce((n, s) => n + s.volumeKg, 0)),
                SYSTEME_UNITES,
              )}
            </Text>
          </View>
        )}
        renderItem={({ item }) => (
          <View className="px-4 pb-2">
            <CarteSeance seance={item} onOuvrir={() => router.push(`/historique/${item.id}`)} />
          </View>
        )}
        onEndReached={() => {
          if (requete.hasNextPage && !requete.isFetchingNextPage) void requete.fetchNextPage();
        }}
        onEndReachedThreshold={0.5}
        ListFooterComponent={
          requete.isFetchingNextPage ? (
            <ActivityIndicator className="py-4" colorClassName="accent-muted-foreground" />
          ) : null
        }
        refreshing={requete.isRefetching && !requete.isFetchingNextPage}
        onRefresh={() => requete.refetch()}
      />
    );
  };

  return (
    <Ecran className="flex-1 bg-background" edges={["top"]}>
      <TitreOnglet titre="Historique" />
      {corps()}
    </Ecran>
  );
}
