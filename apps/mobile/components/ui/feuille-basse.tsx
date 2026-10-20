import { type ReactNode, useEffect } from "react";
import { Modal, Pressable, View } from "react-native";
import { Gesture, GestureDetector, GestureHandlerRootView } from "react-native-gesture-handler";
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

/** Tirée de 80 px vers le bas, ou lancée plus vite que 800 px/s, la feuille se ferme. */
const SEUIL_FERMETURE = 80;
const VITESSE_FERMETURE = 800;

/**
 * Le conteneur de toute feuille basse (D89, D120) : voile, poignée, zone de
 * geste. Le voile, le retour Android et un glissement vers le bas la ferment.
 */
export function FeuilleBasse({
  visible,
  onFermer,
  children,
}: {
  visible: boolean;
  onFermer: () => void;
  children: ReactNode;
}) {
  const { bottom } = useSafeAreaInsets();
  // La feuille suit le doigt vers le bas, jamais vers le haut. Relâchée trop
  // tôt, elle revient ; au-delà du seuil, elle se ferme — le geste attendu de
  // toute feuille basse (Material, iOS).
  const decalage = useSharedValue(0);
  useEffect(() => {
    if (visible) decalage.value = 0;
  }, [visible, decalage]);
  const glisser = Gesture.Pan()
    .runOnJS(true)
    // 10 px avant de s'activer : un appui sur une option reste un appui.
    .activeOffsetY(10)
    .onUpdate((e) => {
      decalage.value = Math.max(0, e.translationY);
    })
    .onEnd((e) => {
      if (e.translationY > SEUIL_FERMETURE || e.velocityY > VITESSE_FERMETURE) onFermer();
      else decalage.value = withTiming(0, { duration: 150 });
    });
  const suivre = useAnimatedStyle(() => ({ transform: [{ translateY: decalage.value }] }));
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      navigationBarTranslucent
      onRequestClose={onFermer}
    >
      {/* Sous Android, le contenu d'un Modal vit hors de la racine des gestes de
          l'app : il lui faut la sienne. */}
      <GestureHandlerRootView style={{ flex: 1 }}>
        <Pressable className="flex-1 bg-black/50" onPress={onFermer} accessibilityLabel="Fermer" />
        <GestureDetector gesture={glisser}>
          <Animated.View style={[{ maxHeight: "85%" }, suivre]}>
            <View
              className="rounded-t-2xl border-border border-t bg-popover px-2 pt-2"
              style={{ paddingBottom: bottom + 8 }}
            >
              <View className="mb-2 h-1 w-9 self-center rounded-full bg-border" />
              {children}
            </View>
          </Animated.View>
        </GestureDetector>
      </GestureHandlerRootView>
    </Modal>
  );
}
