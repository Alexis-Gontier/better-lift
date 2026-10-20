import { useRouter } from "expo-router";
import { ChevronLeft } from "lucide-react-native";
import { View } from "react-native";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { Text } from "@/components/ui/text";

/** L'en-tête d'un écran empilé : retour à gauche, titre sur toute la largeur. */
export function EnteteRetour({ titre }: { titre: string }) {
  const router = useRouter();
  return (
    <View className="h-14 flex-row items-center gap-1 px-2">
      <Button
        variant="ghost"
        size="icon"
        className="size-12"
        onPress={() => router.back()}
        accessibilityLabel="Retour"
      >
        <Icon as={ChevronLeft} className="size-6 text-foreground" />
      </Button>
      <Text className="flex-1 font-semibold text-xl" accessibilityRole="header" numberOfLines={1}>
        {titre}
      </Text>
    </View>
  );
}
