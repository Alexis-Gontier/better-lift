import {
  bilanSeance,
  formaterCharge,
  LIBELLE_ZONE,
  type SeanceEnCours,
  secondesEcoulees,
  zonesTravaillees,
} from "@better-lift/shared";
import { useQueries } from "@tanstack/react-query";
import { ChevronDown } from "lucide-react-native";
import { useState } from "react";
import { Pressable, View } from "react-native";
import { CarteMuscles, Silhouettes } from "@/components/routine/carte-muscles";
import { Button } from "@/components/ui/button";
import { FeuilleBasse } from "@/components/ui/feuille-basse";
import { Icon } from "@/components/ui/icon";
import { Text } from "@/components/ui/text";
import { optionsExercice } from "@/lib/requetes";
import { formaterDuree } from "@/lib/temps";
import { SYSTEME_UNITES } from "@/lib/unites";
import { PLAFOND_TEXTE_DENSE } from "./texte-dense";

// La mini-silhouette : 200 × 400 à l'échelle 1, deux côte à côte dans la hauteur des chiffres.
const ECHELLE_MINI = 0.12;

/**
 * L'en-tête de la séance (D344), comme Hevy : replier, le nom, Terminer ; dessous
 * la durée, le volume, les séries, et les muscles déjà travaillés en petit, qui
 * s'ouvrent en grand d'un appui. Les muscles viennent de la fiche de chaque
 * exercice (gardée hors ligne) : la séance n'en porte pas.
 */
export function EnTeteSeance({
  seance,
  maintenant,
  onReplier,
  onTerminer,
}: {
  seance: SeanceEnCours;
  maintenant: Date;
  onReplier: () => void;
  onTerminer: () => void;
}) {
  const [grand, setGrand] = useState(false);
  const bilan = bilanSeance(seance);
  const totalSeries = seance.exercices.reduce((n, e) => n + e.series.length, 0);
  // Les exercices où au moins une série est faite : les muscles « faits ».
  const faits = [
    ...new Set(seance.exercices.filter((e) => e.series.some((x) => x.faite)).map((e) => e.slug)),
  ];
  const fiches = useQueries({ queries: faits.map((slug) => optionsExercice(slug)) });
  const exercices = fiches.flatMap((f) =>
    f.data ? [{ musclePrincipal: f.data.cible, musclesSecondaires: f.data.secondaires }] : [],
  );
  const zones = zonesTravaillees(exercices);

  return (
    <View className="gap-2 border-border border-b px-4 pt-2 pb-3">
      <View className="flex-row items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          className="-ml-2"
          onPress={onReplier}
          accessibilityLabel="Replier la séance"
        >
          <Icon as={ChevronDown} className="size-6 text-muted-foreground" />
        </Button>
        <Text className="flex-1 font-semibold text-xl" numberOfLines={1} accessibilityRole="header">
          {seance.nom}
        </Text>
        {/* Secondaire (D105) : terminer n'est pas l'action courante d'une séance. */}
        <Button variant="outline" onPress={onTerminer}>
          <Text>Terminer</Text>
        </Button>
      </View>

      <View className="flex-row items-center">
        <Chiffre
          libelle="Durée"
          valeur={formaterDuree(secondesEcoulees(seance.debut, maintenant))}
        />
        <Chiffre libelle="Volume" valeur={formaterCharge(bilan.volumeKg, SYSTEME_UNITES)} />
        <Chiffre libelle="Séries" valeur={`${bilan.seriesFaites}/${totalSeries}`} />
        <Pressable
          onPress={() => setGrand(true)}
          disabled={zones.length === 0}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel={
            zones.length === 0
              ? "Aucun muscle travaillé pour l'instant"
              : `Muscles travaillés : ${zones.map((z) => LIBELLE_ZONE[z.zone]).join(", ")}. Agrandir`
          }
          className="flex-row gap-0.5 rounded-md px-1 active:bg-accent"
        >
          <Silhouettes zones={zones} echelle={ECHELLE_MINI} />
        </Pressable>
      </View>

      <View
        className="h-1 overflow-hidden rounded-full bg-secondary"
        accessibilityLabel={`${bilan.seriesFaites} séries faites sur ${totalSeries}`}
      >
        <View
          className="h-1 bg-foreground"
          style={{ width: `${totalSeries ? (bilan.seriesFaites / totalSeries) * 100 : 0}%` }}
        />
      </View>

      <FeuilleBasse visible={grand} onFermer={() => setGrand(false)}>
        <View className="gap-3 px-2 pb-2">
          <Text className="font-semibold text-lg" accessibilityRole="header">
            Muscles travaillés
          </Text>
          <CarteMuscles exercices={exercices} nu />
        </View>
      </FeuilleBasse>
    </View>
  );
}

function Chiffre({ libelle, valeur }: { libelle: string; valeur: string }) {
  return (
    <View className="flex-1 gap-0.5">
      <Text maxFontSizeMultiplier={PLAFOND_TEXTE_DENSE} className="text-muted-foreground text-xs">
        {libelle}
      </Text>
      <Text
        maxFontSizeMultiplier={PLAFOND_TEXTE_DENSE}
        className="font-semibold tabular-nums"
        numberOfLines={1}
      >
        {valeur}
      </Text>
    </View>
  );
}
