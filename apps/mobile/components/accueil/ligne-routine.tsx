import { dureeEstimeeSec, type RoutineDetail, type RoutineResume } from "@better-lift/shared";
import { ActivityIndicator, Pressable, View } from "react-native";
import { Text } from "@/components/ui/text";

const pluriel = (n: number, mot: string) => `${n} ${mot}${n > 1 ? "s" : ""}`;

/**
 * Une routine de l'accueil (D316) : l'appui LANCE la séance, comme le « Start
 * Routine » de Hevy ; la routine se prépare sur le web. Le détail vient du cache
 * (préchargé pour le hors ligne) ; sans lui, la durée manque.
 */
export function LigneRoutine({
  routine,
  detail,
  aSuivre,
  enOuverture,
  onLancer,
}: {
  routine: RoutineResume;
  detail: RoutineDetail | undefined;
  aSuivre: boolean;
  enOuverture: boolean;
  onLancer: () => void;
}) {
  const minutes = detail ? Math.max(1, Math.round(dureeEstimeeSec(detail.exercices) / 60)) : null;
  return (
    <Pressable
      onPress={onLancer}
      disabled={enOuverture}
      accessibilityRole="button"
      accessibilityHint="Lance la séance"
      className="min-h-16 flex-row items-center gap-3 px-4 py-3 active:bg-accent"
    >
      <View className="flex-1 gap-0.5">
        <View className="flex-row items-center gap-2">
          <Text className="shrink font-medium text-base" numberOfLines={1}>
            {routine.nom}
          </Text>
          {aSuivre ? <Text className="text-muted-foreground text-xs">À suivre</Text> : null}
        </View>
        <Text className="text-muted-foreground text-sm">
          {pluriel(routine.nbExercices, "exercice")}
          {minutes ? ` · ≈ ${minutes} min` : ""}
        </Text>
      </View>
      {enOuverture ? <ActivityIndicator colorClassName="accent-muted-foreground" /> : null}
    </Pressable>
  );
}
