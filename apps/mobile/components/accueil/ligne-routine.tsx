import {
  dureeRoutine,
  ilYa,
  joursEcoules,
  musclesRoutine,
  type RoutineResume,
} from "@better-lift/shared";
import { Play } from "lucide-react-native";
import { ActivityIndicator, Pressable, View } from "react-native";
import { Icon } from "@/components/ui/icon";
import { Text } from "@/components/ui/text";
import { FUSEAU } from "@/lib/fuseau";

const pluriel = (n: number, mot: string) => `${n} ${mot}${n > 1 ? "s" : ""}`;

/**
 * Une routine de l'onglet Routines (D320, D321) : une carte à deux actions, comme Hevy. La
 * carte ouvre la page de la routine ; le segment de droite, en aplat, la LANCE d'un appui.
 */
export function LigneRoutine({
  routine,
  aSuivre,
  enOuverture,
  onOuvrir,
  onLancer,
}: {
  routine: RoutineResume;
  aSuivre: boolean;
  enOuverture: boolean;
  onOuvrir: () => void;
  onLancer: () => void;
}) {
  const derniere = routine.derniereSeance ? joursEcoules(routine.derniereSeance, FUSEAU) : null;
  return (
    <View className="flex-row overflow-hidden rounded-lg border border-border bg-background">
      <Pressable
        onPress={onOuvrir}
        accessibilityRole="button"
        accessibilityHint="Ouvre la routine"
        className="min-h-16 flex-1 flex-row items-center gap-3 px-4 py-3 active:bg-accent"
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
        <View className="items-end gap-0.5">
          <Text className="text-sm tabular-nums">{dureeRoutine(routine.dureeEstimeeSec)}</Text>
          <Text className="text-muted-foreground text-xs">{ilYa(derniere)}</Text>
        </View>
      </Pressable>
      <Pressable
        onPress={onLancer}
        disabled={enOuverture}
        accessibilityRole="button"
        accessibilityLabel={`Lancer ${routine.nom}`}
        className="w-20 items-center justify-center gap-1 bg-primary active:opacity-80"
      >
        {enOuverture ? (
          <ActivityIndicator colorClassName="accent-primary-foreground" />
        ) : (
          <Icon as={Play} className="size-5 text-primary-foreground" />
        )}
        <Text className="font-medium text-primary-foreground text-xs">Lancer</Text>
      </Pressable>
    </View>
  );
}
