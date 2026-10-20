import { View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Button } from "@/components/ui/button";
import { Text } from "@/components/ui/text";
import { formaterDuree } from "@/lib/temps";
import { PLAFOND_TEXTE_DENSE } from "@/lib/theme";
import { cn } from "@/lib/utils";

/**
 * Le repos restant, en bas de l'écran comme chez Hevy (D317) — là où le pouce et
 * l'œil tombent : décompte, −15 s / +15 s, Passer. Il flotte au-dessus de la liste.
 */
export function BandeauRepos({
  restant,
  onPasser,
  onAjuster,
}: {
  restant: number;
  onPasser: () => void;
  /** −15 s / +15 s (D79). */
  onAjuster: (deltaSec: number) => void;
}) {
  const fini = restant === 0;
  // Au-dessus de la barre de gestes du système, jamais dessous.
  const { bottom } = useSafeAreaInsets();
  return (
    <View
      style={{ bottom: 12 + bottom }}
      className={cn(
        "absolute right-3 left-3 min-h-16 flex-row items-center gap-2 rounded-lg border border-border bg-card px-2 shadow-lg shadow-black/20",
        fini && "border-foreground",
      )}
    >
      <Button
        variant="secondary"
        className="h-12 w-14"
        onPress={() => onAjuster(-15)}
        accessibilityLabel="Retirer 15 secondes"
      >
        <Text maxFontSizeMultiplier={PLAFOND_TEXTE_DENSE}>−15</Text>
      </Button>
      <View className="flex-1 items-center">
        {/* Seul le libellé est annoncé, quand le repos se termine : sur tout le
            bandeau, le lecteur d'écran lisait le décompte à chaque seconde. */}
        <Text
          maxFontSizeMultiplier={PLAFOND_TEXTE_DENSE}
          className="text-muted-foreground text-xs"
          accessibilityLiveRegion="polite"
        >
          {fini ? "Repos terminé" : "Repos"}
        </Text>
        <Text
          maxFontSizeMultiplier={PLAFOND_TEXTE_DENSE}
          className="font-bold text-2xl tabular-nums"
        >
          {formaterDuree(restant)}
        </Text>
      </View>
      <Button
        variant="secondary"
        className="h-12 w-14"
        onPress={() => onAjuster(15)}
        accessibilityLabel="Ajouter 15 secondes"
      >
        <Text maxFontSizeMultiplier={PLAFOND_TEXTE_DENSE}>+15</Text>
      </Button>
      <Button className="h-12" onPress={onPasser}>
        <Text maxFontSizeMultiplier={PLAFOND_TEXTE_DENSE}>{fini ? "OK" : "Passer"}</Text>
      </Button>
    </View>
  );
}
