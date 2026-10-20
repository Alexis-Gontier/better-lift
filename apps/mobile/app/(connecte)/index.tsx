import { routineASuivre } from "@better-lift/shared";
import { useInfiniteQuery, useQueries, useQuery } from "@tanstack/react-query";
import { Plus } from "lucide-react-native";
import { FlatList, View } from "react-native";
import { LigneRoutine } from "@/components/accueil/ligne-routine";
import { Button } from "@/components/ui/button";
import { Ecran } from "@/components/ui/ecran";
import { Chargement, Erreur, Vide } from "@/components/ui/etats";
import { Icon } from "@/components/ui/icon";
import { Separator } from "@/components/ui/separator";
import { Text } from "@/components/ui/text";
import { TitreOnglet } from "@/components/ui/titre-onglet";
import { useDemarrer } from "@/lib/demarrer";
import { optionsRoutine, optionsRoutines, optionsSeances } from "@/lib/requetes";

/**
 * L'onglet Routines (D316, D319) : la séance vide, les routines qui se lancent
 * d'un appui. La séance en cours s'affiche au-dessus de la barre d'onglets.
 */
export default function Accueil() {
  const { vide, routine, ouverture } = useDemarrer();
  return (
    <Ecran className="flex-1 bg-background" edges={["top"]}>
      <TitreOnglet titre="Routines" />
      <View className="px-4 pb-3">
        <Button variant="outline" className="h-12" onPress={() => void vide()}>
          <Icon as={Plus} className="size-5 text-foreground" />
          <Text>Séance vide</Text>
        </Button>
      </View>
      <ListeRoutines onLancer={(id) => void routine(id)} ouverture={ouverture} />
    </Ecran>
  );
}

function ListeRoutines({
  onLancer,
  ouverture,
}: {
  onLancer: (id: string) => void;
  ouverture: string | null;
}) {
  const routines = useQuery(optionsRoutines());
  const seances = useInfiniteQuery(optionsSeances());
  // Les détails sont en cache (préchargés pour le hors ligne) : durée sans attente.
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
    return <Vide titre="Pas encore de routine." message="Prépare-la sur le web." />;
  }
  return (
    <FlatList
      className="flex-1"
      data={routines.data}
      keyExtractor={(r) => r.id}
      refreshing={routines.isRefetching}
      onRefresh={() => routines.refetch()}
      ItemSeparatorComponent={Filet}
      renderItem={({ item, index }) => (
        <LigneRoutine
          routine={item}
          detail={details[index]?.data}
          aSuivre={suivante?.id === item.id}
          enOuverture={ouverture === item.id}
          onLancer={() => onLancer(item.id)}
        />
      )}
    />
  );
}

function Filet() {
  return <Separator className="ml-4" />;
}
