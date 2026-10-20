import {
  dureeRoutine,
  ilYa,
  joursEcoules,
  musclesRoutine,
  type RoutineResume,
} from "@better-lift/shared";
import { ActivityIndicator, Pressable, View } from "react-native";
import { Text } from "@/components/ui/text";
import { FUSEAU } from "@/lib/fuseau";

const pluriel = (n: number, mot: string) => `${n} ${mot}${n > 1 ? "s" : ""}`;

/**
 * Une routine de l'onglet Routines, en carte comme sur le web (D320) : nom et
 * muscles, durée estimée et dernière fois. L'appui LANCE la séance, comme le
 * « Start Routine » de Hevy (D316) ; la routine se prépare sur le web.
 */
export function LigneRoutine({
  routine,
  aSuivre,
  enOuverture,
  onLancer,
}: {
  routine: RoutineResume;
  aSuivre: boolean;
  enOuverture: boolean;
  onLancer: () => void;
}) {
  const derniere = routine.derniereSeance ? joursEcoules(routine.derniereSeance, FUSEAU) : null;
  return (
    <Pressable
      onPress={onLancer}
      disabled={enOuverture}
      accessibilityRole="button"
      accessibilityHint="Lance la séance"
      className="min-h-16 flex-row items-center gap-3 rounded-lg border border-border bg-background px-4 py-3 active:bg-accent"
    >
      <View className="flex-1 gap-0.5">
        <View className="flex-row items-center gap-2">
          <Text className="shrink font-medium text-base" numberOfLines={1}>
            {routine.nom}
          </Text>
          {aSuivre ? <Text className="text-muted-foreground text-xs">À suivre</Text> : null}
        </View>
        <Text className="text-muted-foreground text-sm" numberOfLines={1}>
          {[pluriel(routine.nbExercices, "exercice"), ...musclesRoutine(routine)].join(" · ")}
        </Text>
      </View>
      {enOuverture ? (
        <ActivityIndicator colorClassName="accent-muted-foreground" />
      ) : (
        <View className="items-end gap-0.5">
          <Text className="text-sm tabular-nums">{dureeRoutine(routine.dureeEstimeeSec)}</Text>
          <Text className="text-muted-foreground text-xs">{ilYa(derniere)}</Text>
        </View>
      )}
    </Pressable>
  );
}
