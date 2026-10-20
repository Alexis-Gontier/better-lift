import type { GroupeSuperset } from "@better-lift/shared";
import type { ReactNode } from "react";
import { Pressable, View } from "react-native";
import { Text } from "@/components/ui/text";
import { cn } from "@/lib/utils";

/**
 * Le repère d'un superset (D151, D317) : un filet gris à gauche de chaque
 * membre, continu d'un membre à l'autre, et l'étiquette « Superset A » au-dessus
 * du premier, qui ouvre les options du groupe.
 */
export function RepereSuperset({
  groupe,
  index,
  onEtiquette,
  children,
}: {
  groupe: GroupeSuperset | null;
  index: number;
  /** Sans elle (page d'une routine, en lecture seule), l'étiquette n'ouvre rien. */
  onEtiquette?: () => void;
  children: ReactNode;
}) {
  if (!groupe) return <>{children}</>;
  const premier = index === groupe.debut;
  return (
    <View className="flex-row gap-2">
      <View
        className={cn(
          "w-0.75 bg-muted-foreground",
          premier && "mt-2 rounded-t-full",
          index === groupe.fin && "rounded-b-full",
        )}
      />
      <View className="min-w-0 flex-1">
        {premier && !onEtiquette ? (
          <View className="min-h-8 justify-center">
            <Text className="font-bold text-muted-foreground text-xs uppercase tracking-widest">
              Superset {groupe.lettre}
            </Text>
          </View>
        ) : premier ? (
          <Pressable
            onPress={onEtiquette}
            hitSlop={8}
            className="min-h-8 justify-center self-start pr-3"
            accessibilityRole="button"
            accessibilityLabel={`Superset ${groupe.lettre}, options`}
          >
            <Text className="font-bold text-muted-foreground text-xs uppercase tracking-widest">
              Superset {groupe.lettre}
            </Text>
          </Pressable>
        ) : null}
        {children}
      </View>
    </View>
  );
}
