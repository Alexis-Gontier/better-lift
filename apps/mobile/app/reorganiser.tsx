import { deplacerExercice, type ExerciceEnCours, groupeDe } from "@better-lift/shared";
import { useRouter } from "expo-router";
import { GripVertical } from "lucide-react-native";
import { Pressable, View } from "react-native";
import DraggableFlatList, { ScaleDecorator } from "react-native-draggable-flatlist";
import { Button } from "@/components/ui/button";
import { Ecran } from "@/components/ui/ecran";
import { Icon } from "@/components/ui/icon";
import { Text } from "@/components/ui/text";
import { useSeance } from "@/lib/seance";
import { cn } from "@/lib/utils";

/** Une clé stable par exercice, même quand le même mouvement revient deux fois. */
function avecCles(exercices: ExerciceEnCours[]) {
  const vus = new Map<string, number>();
  return exercices.map((e, i) => {
    const n = (vus.get(e.slug) ?? 0) + 1;
    vus.set(e.slug, n);
    return { cle: `${e.slug}#${n}`, i, e };
  });
}

/**
 * Réorganiser les exercices de la séance (D89) : une liste compacte, sans les
 * séries, où l'on glisse un exercice par sa poignée — ou par un appui long.
 * Chaque dépôt s'écrit aussitôt dans le brouillon.
 */
export default function Reorganiser() {
  const router = useRouter();
  const { seance, modifier } = useSeance();
  if (!seance) return <Ecran className="flex-1 bg-background" />;
  // La lettre du superset de chaque exercice (D151) ; le glisser suit D148.
  const lettres = seance.exercices.map((_, i) => groupeDe(seance.exercices, i)?.lettre ?? null);

  return (
    <Ecran className="flex-1 bg-background" edges={["top", "bottom"]}>
      <View className="h-14 flex-row items-center px-4">
        <Text className="flex-1 font-semibold text-xl" accessibilityRole="header">
          Réorganiser
        </Text>
        <Button onPress={() => router.back()}>
          <Text>OK</Text>
        </Button>
      </View>
      <Text className="px-4 pb-2 text-muted-foreground text-sm">
        Glisse un exercice par sa poignée pour le déplacer.
      </Text>
      <DraggableFlatList
        data={avecCles(seance.exercices)}
        keyExtractor={(x) => x.cle}
        onDragEnd={({ from, to }) => modifier(deplacerExercice(seance, from, to))}
        renderItem={({ item, drag, isActive }) => (
          <ScaleDecorator>
            <Pressable
              onLongPress={drag}
              delayLongPress={200}
              disabled={isActive}
              className={cn(
                "min-h-13 flex-row items-center gap-3 border-border border-b bg-background pl-4",
                isActive && "bg-secondary",
              )}
            >
              {lettres[item.i] ? (
                <Text
                  className="min-w-3 font-bold text-muted-foreground text-sm"
                  accessibilityLabel={`Superset ${lettres[item.i]}`}
                >
                  {lettres[item.i]}
                </Text>
              ) : null}
              <Text className="flex-1 font-medium" numberOfLines={1}>
                {item.e.nom}
              </Text>
              <Text className="text-muted-foreground text-sm">
                {item.e.series.length} {item.e.series.length > 1 ? "séries" : "série"}
              </Text>
              <Pressable
                onPressIn={drag}
                hitSlop={8}
                className="h-13 w-11 items-center justify-center"
                accessibilityLabel={`Déplacer ${item.e.nom}`}
              >
                <Icon as={GripVertical} className="size-5 text-muted-foreground" />
              </Pressable>
            </Pressable>
          </ScaleDecorator>
        )}
      />
    </Ecran>
  );
}
