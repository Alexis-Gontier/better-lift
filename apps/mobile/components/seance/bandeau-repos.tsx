import { View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Button } from "@/components/ui/button";
import { Text } from "@/components/ui/text";
import { formaterDuree } from "@/lib/temps";
import { PLAFOND_TEXTE_DENSE } from "./texte-dense";

/**
 * Le repos restant, collé en bas de l'écran comme chez Hevy (D317, D335) — là où
 * le pouce et l'œil tombent : une barre qui se vide, le décompte, −15 s / +15 s,
 * Passer. Il couvre le bas de la liste, qui lui garde de la marge.
 */
export function BandeauRepos({
  restant,
  part,
  onPasser,
  onAjuster,
}: {
  restant: number;
  /** De 1 à 0, la barre ; `null` pour un brouillon sans durée (pas de barre). */
  part: number | null;
  onPasser: () => void;
  /** −15 s / +15 s (D79). */
  onAjuster: (deltaSec: number) => void;
}) {
  const fini = restant === 0;
  // Le fond descend sous la barre de gestes ; les boutons restent au-dessus.
  const { bottom } = useSafeAreaInsets();
  return (
    <View
      style={{ paddingBottom: 8 + bottom }}
      className="absolute right-0 bottom-0 left-0 border-border border-t bg-card"
    >
      <View className="h-1 bg-secondary">
        {part === null ? null : (
          <View className="h-1 bg-foreground" style={{ width: `${part * 100}%` }} />
        )}
      </View>
      <View className="flex-row items-center gap-2 px-3 pt-2">
        <Ajuster libelle="−15" accessibilite="Retirer 15 secondes" onPress={() => onAjuster(-15)} />
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
        <Ajuster libelle="+15" accessibilite="Ajouter 15 secondes" onPress={() => onAjuster(15)} />
        <Button className="h-12" onPress={onPasser}>
          <Text maxFontSizeMultiplier={PLAFOND_TEXTE_DENSE} numberOfLines={1}>
            {fini ? "OK" : "Passer"}
          </Text>
        </Button>
      </View>
    </View>
  );
}

/**
 * −15 / +15 : sans largeur fixe et sur une seule ligne. Avec `w-14`, le « − »,
 * plus large que le « + », renvoyait « 5 » à la ligne sous un texte agrandi.
 */
function Ajuster({
  libelle,
  accessibilite,
  onPress,
}: {
  libelle: string;
  accessibilite: string;
  onPress: () => void;
}) {
  return (
    <Button
      variant="secondary"
      className="h-12 min-w-14 px-3"
      onPress={onPress}
      accessibilityLabel={accessibilite}
    >
      <Text maxFontSizeMultiplier={PLAFOND_TEXTE_DENSE} numberOfLines={1}>
        {libelle}
      </Text>
    </Button>
  );
}
