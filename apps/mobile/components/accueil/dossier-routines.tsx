import { ChevronDown, ChevronRight } from "lucide-react-native";
import type { ReactNode } from "react";
import { Pressable, View } from "react-native";
import { Icon } from "@/components/ui/icon";
import { Text } from "@/components/ui/text";
import { cn } from "@/lib/utils";

/**
 * Un dossier de routines, repliable comme sur le web (D257, D320) : sa tête
 * (chevron, nom, nombre) puis ses cartes. Les dossiers se rangent sur le web :
 * ni glisser, ni menu ici.
 */
export function DossierRoutines({
  nom,
  nombre,
  ouvert,
  onBasculer,
  children,
}: {
  /** `null` : « Sans dossier ». */
  nom: string | null;
  nombre: number;
  ouvert: boolean;
  onBasculer: () => void;
  children: ReactNode;
}) {
  return (
    <View className="gap-2">
      <Pressable
        onPress={onBasculer}
        accessibilityRole="button"
        accessibilityState={{ expanded: ouvert }}
        accessibilityLabel={`${nom ?? "Sans dossier"}, ${nombre} routine${nombre > 1 ? "s" : ""}`}
        className="-mx-2 h-12 flex-row items-center gap-2 rounded-md px-2 active:bg-accent"
      >
        <Icon as={ouvert ? ChevronDown : ChevronRight} className="size-5 text-muted-foreground" />
        <Text
          className={cn("shrink font-medium", !nom && "text-muted-foreground")}
          numberOfLines={1}
        >
          {nom ?? "Sans dossier"}
        </Text>
        <Text className="text-muted-foreground tabular-nums">{nombre}</Text>
      </Pressable>
      {ouvert ? children : null}
    </View>
  );
}
