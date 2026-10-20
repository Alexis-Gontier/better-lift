import { dureeRoutine, groupeDe, ilYa, joursEcoules, roleRepos } from "@better-lift/shared";
import { useQuery } from "@tanstack/react-query";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ChevronLeft, Play } from "lucide-react-native";
import { useState } from "react";
import { ActivityIndicator, ScrollView, View } from "react-native";
import { CarteExerciceRoutine } from "@/components/routine/carte-exercice-routine";
import { CarteMuscles } from "@/components/routine/carte-muscles";
import { RepereSuperset } from "@/components/seance/repere-superset";
import { Button } from "@/components/ui/button";
import { Ecran } from "@/components/ui/ecran";
import { Chargement, Erreur, Vide } from "@/components/ui/etats";
import { Icon } from "@/components/ui/icon";
import { Text } from "@/components/ui/text";
import { useDemarrer } from "@/lib/demarrer";
import { FUSEAU } from "@/lib/fuseau";
import { optionsRoutine, optionsRoutines } from "@/lib/requetes";

const pluriel = (n: number, mot: string) => `${n} ${mot}${n > 1 ? "s" : ""}`;

/**
 * La page d'une routine (D321), en lecture seule : on la regarde avant de la lancer, comme
 * dans Hevy. Les exercices sont repliés (D253) ; la routine se modifie sur le web.
 */
export default function PageRoutine() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const detail = useQuery(optionsRoutine(id));
  // Durée et dernière fois : le résumé de la liste, déjà en cache.
  const resume = useQuery({
    ...optionsRoutines(),
    select: (d) => d.routines.find((r) => r.id === id),
  }).data;
  const { routine: lancer, ouverture } = useDemarrer();
  const [ouverts, setOuverts] = useState<ReadonlySet<number>>(() => new Set());

  const entete = (
    <View className="h-14 flex-row items-center gap-1 px-2">
      <Button
        variant="ghost"
        size="icon"
        className="size-12"
        onPress={() => router.back()}
        accessibilityLabel="Retour"
      >
        <Icon as={ChevronLeft} className="size-6 text-foreground" />
      </Button>
      <Text className="flex-1 font-semibold text-xl" accessibilityRole="header" numberOfLines={1}>
        {detail.data?.nom ?? resume?.nom ?? "Routine"}
      </Text>
    </View>
  );

  const corps = () => {
    if (detail.isPending && detail.fetchStatus === "paused") {
      return <Vide titre="Hors ligne" message="La routine apparaîtra au retour du réseau." />;
    }
    if (detail.isPending) return <Chargement forme="routine" />;
    if (detail.isError && !detail.data) {
      return (
        <Erreur message="La routine n'a pas pu se charger." onReessayer={() => detail.refetch()} />
      );
    }
    const routine = detail.data;
    const exercices = routine.exercices;
    if (exercices.length === 0) {
      return <Vide titre="Routine vide" message="Ajoute-lui des exercices sur le web." />;
    }
    const tousOuverts = ouverts.size === exercices.length;
    const basculer = (i: number) =>
      setOuverts((avant) => {
        const apres = new Set(avant);
        if (!apres.delete(i)) apres.add(i);
        return apres;
      });
    const meta = [
      pluriel(exercices.length, "exercice"),
      resume ? dureeRoutine(resume.dureeEstimeeSec) : null,
      resume
        ? ilYa(resume.derniereSeance ? joursEcoules(resume.derniereSeance, FUSEAU) : null)
        : null,
    ].filter(Boolean);

    return (
      <ScrollView contentContainerClassName="gap-4 px-4 pb-8">
        <Text className="text-muted-foreground">{meta.join(" · ")}</Text>
        <Button className="h-12" onPress={() => void lancer(routine.id)} disabled={!!ouverture}>
          {ouverture ? (
            <ActivityIndicator colorClassName="accent-primary-foreground" />
          ) : (
            <Icon as={Play} className="size-4 text-primary-foreground" />
          )}
          <Text>Lancer</Text>
        </Button>
        {routine.note ? <Text className="text-muted-foreground">{routine.note}</Text> : null}
        <CarteMuscles exercices={exercices} />

        <View className="gap-2">
          <View className="flex-row items-center justify-between">
            <Text className="font-medium" accessibilityRole="header">
              Exercices
            </Text>
            <Button
              variant="ghost"
              className="h-12"
              onPress={() =>
                setOuverts(tousOuverts ? new Set() : new Set(exercices.map((_, i) => i)))
              }
            >
              <Text>{tousOuverts ? "Tout replier" : "Tout déplier"}</Text>
            </Button>
          </View>
          {exercices.map((e, i) => (
            <RepereSuperset key={`${e.slug}-${i}`} groupe={groupeDe(exercices, i)} index={i}>
              <CarteExerciceRoutine
                exercice={e}
                ouvert={ouverts.has(i)}
                onBasculer={() => basculer(i)}
                repos={roleRepos(exercices, i)}
              />
            </RepereSuperset>
          ))}
        </View>
      </ScrollView>
    );
  };

  return (
    <Ecran className="flex-1 bg-background" edges={["top", "bottom"]}>
      {entete}
      {corps()}
    </Ecran>
  );
}
