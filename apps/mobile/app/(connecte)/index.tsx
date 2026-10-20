import { parDossier, type RoutineResume, routineASuivre } from "@better-lift/shared";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { Plus } from "lucide-react-native";
import { useState } from "react";
import { FlatList, View } from "react-native";
import { DossierRoutines } from "@/components/accueil/dossier-routines";
import { LigneRoutine } from "@/components/accueil/ligne-routine";
import { Button } from "@/components/ui/button";
import { Ecran } from "@/components/ui/ecran";
import { Chargement, Erreur, Vide } from "@/components/ui/etats";
import { Icon } from "@/components/ui/icon";
import { Text } from "@/components/ui/text";
import { TitreOnglet } from "@/components/ui/titre-onglet";
import { useDemarrer } from "@/lib/demarrer";
import { optionsRoutines, optionsSeances } from "@/lib/requetes";

/**
 * L'onglet Routines (D316, D319, D320) : la séance vide, puis les routines
 * rangées par dossier, qui se lancent d'un appui. La séance en cours s'affiche
 * au-dessus de la barre d'onglets.
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
  const router = useRouter();
  const requete = useQuery(optionsRoutines());
  const seances = useInfiniteQuery(optionsSeances());
  // Les dossiers repliés, le temps que l'app reste ouverte : tout s'ouvre déplié.
  const [replies, setReplies] = useState<ReadonlySet<string>>(() => new Set());

  if (requete.isPending && requete.fetchStatus === "paused") {
    return <Vide titre="Hors ligne" message="Les routines apparaîtront au retour du réseau." />;
  }
  if (requete.isPending) return <Chargement />;
  if (requete.isError && !requete.data) {
    return (
      <Erreur
        message="Les routines n'ont pas pu se charger."
        onReessayer={() => requete.refetch()}
      />
    );
  }
  const { routines, dossiers } = requete.data;
  if (routines.length === 0) {
    return <Vide titre="Pas encore de routine." message="Prépare-la sur le web." />;
  }

  const suivante = routineASuivre(routines, seances.data?.pages.flatMap((p) => p.seances) ?? []);
  const groupes = parDossier(routines, dossiers);
  // Aucun dossier : une liste simple, sans tête « Sans dossier ».
  const sansDossiers = groupes.length === 1 && groupes[0]?.dossier === null;
  const basculer = (cle: string) =>
    setReplies((avant) => {
      const apres = new Set(avant);
      if (!apres.delete(cle)) apres.add(cle);
      return apres;
    });
  const cartes = (liste: RoutineResume[]) => (
    <View className="gap-2">
      {liste.map((r) => (
        <LigneRoutine
          key={r.id}
          routine={r}
          aSuivre={suivante?.id === r.id}
          enOuverture={ouverture === r.id}
          onOuvrir={() => router.push(`/routine/${r.id}`)}
          onLancer={() => onLancer(r.id)}
        />
      ))}
    </View>
  );

  return (
    <FlatList
      className="flex-1"
      contentContainerClassName="gap-3 px-4 pb-4"
      data={groupes}
      keyExtractor={(g) => g.dossier?.id ?? "-"}
      refreshing={requete.isRefetching}
      onRefresh={() => requete.refetch()}
      renderItem={({ item }) => {
        if (sansDossiers) return cartes(item.routines);
        const cle = item.dossier?.id ?? "-";
        return (
          <DossierRoutines
            nom={item.dossier?.nom ?? null}
            nombre={item.routines.length}
            ouvert={!replies.has(cle)}
            onBasculer={() => basculer(cle)}
          >
            {item.routines.length > 0 ? (
              cartes(item.routines)
            ) : (
              <Text className="pb-2 pl-7 text-muted-foreground text-sm">Aucune routine.</Text>
            )}
          </DossierRoutines>
        );
      }}
    />
  );
}
