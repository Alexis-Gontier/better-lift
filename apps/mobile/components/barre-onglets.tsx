import type { Tabs } from "expo-router";
import { Dumbbell, History, type LucideIcon, User } from "lucide-react-native";
import type { ComponentProps } from "react";
import { Pressable, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BandeauSeance } from "@/components/bandeau-seance";
import { Icon } from "@/components/ui/icon";
import { Text } from "@/components/ui/text";
import { cn } from "@/lib/utils";

// `expo-router` n'exporte pas `BottomTabBarProps` à sa racine : on le tire de `Tabs`.
type Props = Parameters<NonNullable<ComponentProps<typeof Tabs>["tabBar"]>>[0];

const ONGLETS: Record<string, { libelle: string; icone: LucideIcon }> = {
  index: { libelle: "Routines", icone: Dumbbell },
  historique: { libelle: "Historique", icone: History },
  profil: { libelle: "Profil", icone: User },
};

/**
 * La barre d'onglets (D319) : la séance en cours au-dessus, puis les trois
 * onglets. L'onglet actif se marque par la forme — une pilule derrière l'icône,
 * le libellé en gras —, pas par la couleur (Material 3).
 */
export function BarreOnglets({ state, navigation }: Props) {
  const { bottom } = useSafeAreaInsets();
  return (
    <View className="bg-background">
      <BandeauSeance />
      <View
        className="flex-row border-border border-t"
        style={{ paddingBottom: bottom }}
        accessibilityRole="tablist"
      >
        {state.routes.map((route, index) => {
          const onglet = ONGLETS[route.name];
          if (!onglet) return null;
          const actif = state.index === index;
          const appuyer = () => {
            const evenement = navigation.emit({
              type: "tabPress",
              target: route.key,
              canPreventDefault: true,
            });
            if (!actif && !evenement.defaultPrevented) navigation.navigate(route.name);
          };
          return (
            <Pressable
              key={route.key}
              onPress={appuyer}
              accessibilityRole="tab"
              accessibilityState={{ selected: actif }}
              accessibilityLabel={onglet.libelle}
              className="min-h-16 flex-1 items-center justify-center gap-1 py-2"
            >
              <View
                className={cn(
                  "h-8 w-16 items-center justify-center rounded-full",
                  actif && "bg-secondary",
                )}
              >
                <Icon
                  as={onglet.icone}
                  className={cn("size-6", actif ? "text-foreground" : "text-muted-foreground")}
                />
              </View>
              <Text
                className={cn(
                  "text-xs",
                  actif ? "font-semibold text-foreground" : "text-muted-foreground",
                )}
              >
                {onglet.libelle}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
