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

/**
 * Les quatre états de chaque écran (chargement, erreur, vide — le nominal est
 * l'écran lui-même). Une seule implémentation : un écran qui les dessinerait à
 * sa façon finirait par en oublier un.
 *
 * Le chargement d'une page (D176) : un squelette de lignes, pas un indicateur
 * au milieu du contenu. Il pulse doucement, immobile si le téléphone demande
 * moins d'animations.
 */
export function Chargement() {
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
      <View className="flex-1 gap-3 p-4">
        <View className="h-14 rounded-md bg-muted" />
        <View className="h-14 rounded-md bg-muted" />
        <View className="h-14 rounded-md bg-muted" />
      </View>
    </Animated.View>
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
