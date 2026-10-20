import type { LucideIcon } from "lucide-react-native";
import { Check } from "lucide-react-native";
import { Pressable, View } from "react-native";
import { Icon } from "@/components/ui/icon";
import { Text } from "@/components/ui/text";
import { cn } from "@/lib/utils";
import { FeuilleBasse } from "./feuille-basse";

export type OptionFeuille = {
  libelle: string;
  icone?: LucideIcon;
  /** Le danger a sa couleur (D36) — jamais l'action ni le record. */
  danger?: boolean;
  /** Visible mais inerte, avec sa raison (« bientôt »). */
  inactive?: string;
  /** L'option en vigueur, cochée à droite. */
  choisie?: boolean;
  onPress?: () => void;
};

/**
 * Une feuille qui monte du bas (D89), à la Hevy : les actions rares d'un
 * élément, sous le pouce. Elle se ferme AVANT d'exécuter l'option : une
 * confirmation ouverte par l'option ne s'empile pas sur la feuille.
 */
export function Feuille({
  visible,
  titre,
  message,
  options,
  onFermer,
}: {
  visible: boolean;
  titre?: string;
  /**
   * Une question, plus qu'un menu (confirmation) : le titre passe en encre et
   * en gras, le message l'explique dessous.
   */
  message?: string;
  options: OptionFeuille[];
  onFermer: () => void;
}) {
  return (
    <FeuilleBasse visible={visible} onFermer={onFermer}>
      {message ? (
        <View className="gap-1 px-3 pt-1 pb-3">
          <Text className="font-semibold text-xl" accessibilityRole="header">
            {titre}
          </Text>
          <Text className="text-muted-foreground">{message}</Text>
        </View>
      ) : titre ? (
        <Text
          className="px-3 py-2 text-muted-foreground text-sm"
          accessibilityRole="header"
          numberOfLines={1}
        >
          {titre}
        </Text>
      ) : null}
      {options.map((o) => {
        const couleur = o.inactive
          ? "text-muted-foreground"
          : o.danger
            ? "text-destructive"
            : "text-foreground";
        return (
          <Pressable
            key={o.libelle}
            disabled={Boolean(o.inactive)}
            onPress={() => {
              onFermer();
              o.onPress?.();
            }}
            className="min-h-12 flex-row items-center gap-3 rounded-md px-3 active:bg-accent"
            accessibilityRole="button"
            accessibilityState={{ disabled: Boolean(o.inactive), selected: o.choisie }}
          >
            {o.icone ? <Icon as={o.icone} className={cn("size-5", couleur)} /> : null}
            <Text className={cn("flex-1", couleur)}>{o.libelle}</Text>
            {o.inactive ? (
              <Text className="text-muted-foreground text-sm">{o.inactive}</Text>
            ) : null}
            {o.choisie ? (
              <Icon as={Check} className="size-4.5 text-foreground" strokeWidth={2.6} />
            ) : null}
          </Pressable>
        );
      })}
    </FeuilleBasse>
  );
}
