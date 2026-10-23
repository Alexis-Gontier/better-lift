import { useRef } from "react";
import { type NativeScrollEvent, type NativeSyntheticEvent, ScrollView, View } from "react-native";
import { Text } from "@/components/ui/text";
import { cn } from "@/lib/utils";
import { vibrer } from "@/lib/vibrations";

const HAUTEUR = 44;
// Cinq lignes visibles : deux de part et d'autre de celle choisie.
const VISIBLES = 5;

/**
 * Une roue à la iOS (D343) : on la fait tourner, la ligne du milieu est choisie.
 * Un `ScrollView` aimanté sur la hauteur d'une ligne, sans module natif : un
 * sélecteur natif n'est pas dans l'APK déjà installé, et `eas update` ne livre
 * que du JS.
 */
export function Roue({
  libelles,
  index,
  onChange,
  accessibilite,
  className,
}: {
  libelles: readonly string[];
  index: number;
  onChange: (index: number) => void;
  accessibilite: string;
  className?: string;
}) {
  const courant = useRef(index);
  const arret = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const i = Math.max(
      0,
      Math.min(libelles.length - 1, Math.round(e.nativeEvent.contentOffset.y / HAUTEUR)),
    );
    if (i === courant.current) return;
    courant.current = i;
    vibrer.selection();
    onChange(i);
  };
  const bord = (HAUTEUR * (VISIBLES - 1)) / 2;

  return (
    <View
      className={className}
      style={{ height: HAUTEUR * VISIBLES }}
      accessible
      accessibilityRole="adjustable"
      accessibilityLabel={accessibilite}
      accessibilityValue={{ text: libelles[index] }}
      accessibilityActions={[{ name: "increment" }, { name: "decrement" }]}
      onAccessibilityAction={(e) => {
        const i = index + (e.nativeEvent.actionName === "increment" ? 1 : -1);
        if (i >= 0 && i < libelles.length) onChange(i);
      }}
    >
      {/* La bande de la ligne choisie, derrière les chiffres. */}
      <View
        className="absolute right-0 left-0 rounded-md bg-secondary"
        style={{ top: bord, height: HAUTEUR }}
      />
      <ScrollView
        contentOffset={{ x: 0, y: index * HAUTEUR }}
        snapToInterval={HAUTEUR}
        decelerationRate="fast"
        showsVerticalScrollIndicator={false}
        nestedScrollEnabled
        contentContainerStyle={{ paddingVertical: bord }}
        onMomentumScrollEnd={arret}
        // Relâchée sans élan, la roue ne déclenche pas la fin d'élan.
        onScrollEndDrag={(e) => {
          if (Math.abs(e.nativeEvent.velocity?.y ?? 0) < 0.05) arret(e);
        }}
      >
        {libelles.map((l, i) => (
          <View key={l} style={{ height: HAUTEUR }} className="items-center justify-center">
            <Text
              className={cn(
                "text-xl tabular-nums",
                i === index ? "font-semibold" : "text-muted-foreground",
              )}
            >
              {l}
            </Text>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}
