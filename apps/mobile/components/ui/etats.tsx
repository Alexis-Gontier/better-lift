import { useEffect } from "react";
import { View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";
import { Button } from "@/components/ui/button";
import { Text } from "@/components/ui/text";
import { cn } from "@/lib/utils";

/**
 * Les quatre états de chaque écran (chargement, erreur, vide — le nominal est
 * l'écran lui-même). Une seule implémentation : un écran qui les dessinerait à
 * sa façon finirait par en oublier un.
 *
 * Le chargement d'une page (D176, D327) : un squelette à la forme de l'écran
 * attendu — les cartes de Routines, la page d'une routine, les lignes du
 * catalogue —, pas un indicateur au milieu du contenu. Il pulse doucement,
 * immobile si le téléphone demande moins d'animations.
 */
export function Chargement({ forme = "lignes" }: { forme?: "lignes" | "routines" | "routine" }) {
  const reduit = useReducedMotion();
  const opacite = useSharedValue(1);
  useEffect(() => {
    if (reduit) return;
    opacite.value = withRepeat(withTiming(0.5, { duration: 900 }), -1, true);
  }, [reduit, opacite]);
  const pulse = useAnimatedStyle(() => ({ opacity: opacite.value }));
  return (
    <Animated.View
      style={[{ flex: 1 }, pulse]}
      accessible
      accessibilityLabel="Chargement"
      accessibilityRole="progressbar"
    >
      {forme === "routines" ? (
        <SqueletteRoutines />
      ) : forme === "routine" ? (
        <SqueletteRoutine />
      ) : (
        <SqueletteLignes />
      )}
    </Animated.View>
  );
}

const CINQ = [0, 1, 2, 3, 4];

/** Une barre de texte : sa hauteur suit la ligne, sa largeur la longueur attendue. */
function Barre({ className }: { className: string }) {
  return <View className={cn("rounded-sm bg-muted", className)} />;
}

/** Les cartes de l'onglet Routines (`LigneRoutine`) : deux lignes et le segment « Lancer ». */
function SqueletteRoutines() {
  return (
    <View className="gap-2 px-4">
      {CINQ.map((i) => (
        <View key={i} className="min-h-16 flex-row overflow-hidden rounded-lg border border-border">
          <View className="flex-1 justify-center gap-2 px-4 py-3">
            <Barre className="h-4 w-1/3" />
            <Barre className="h-3 w-2/3" />
          </View>
          <View className="w-20 bg-muted" />
        </View>
      ))}
    </View>
  );
}

/** La page d'une routine : résumé, « Lancer », carte des muscles, exercices repliés. */
function SqueletteRoutine() {
  return (
    <View className="gap-4 px-4">
      <Barre className="h-4 w-1/2" />
      <View className="h-12 rounded-md bg-muted" />
      <View className="h-56 rounded-lg bg-muted" />
      <View className="gap-2">
        {CINQ.slice(0, 3).map((i) => (
          <View
            key={i}
            className="min-h-16 flex-row items-center gap-3 rounded-lg border border-border px-3 py-3"
          >
            <View className="size-12 rounded-md bg-muted" />
            <View className="flex-1 gap-2">
              <Barre className="h-4 w-1/2" />
              <Barre className="h-3 w-1/3" />
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}

/** Les lignes du catalogue : vignette, nom, groupe. */
function SqueletteLignes() {
  return (
    <View>
      {CINQ.map((i) => (
        <View key={i} className="min-h-17 flex-row items-center gap-3 px-4 py-2">
          <View className="size-13 rounded-md bg-muted" />
          <View className="flex-1 gap-2">
            <Barre className="h-4 w-2/3" />
            <Barre className="h-3 w-1/3" />
          </View>
        </View>
      ))}
    </View>
  );
}

export function Erreur({ message, onReessayer }: { message: string; onReessayer: () => void }) {
  return (
    <View className="flex-1 items-center justify-center gap-3 p-6">
      <Text className="text-center text-muted-foreground">{message}</Text>
      <Button variant="outline" className="h-12" onPress={onReessayer}>
        <Text>Réessayer</Text>
      </Button>
    </View>
  );
}

export function Vide({ titre, message }: { titre: string; message: string }) {
  return (
    <View className="flex-1 items-center justify-center gap-2 p-6">
      <Text className="font-semibold" accessibilityRole="header">
        {titre}
      </Text>
      <Text className="text-center text-muted-foreground">{message}</Text>
    </View>
  );
}
