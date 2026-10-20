import { View } from "react-native";
import { Text } from "@/components/ui/text";

/** L'en-tête d'un onglet (D319). */
export function TitreOnglet({ titre }: { titre: string }) {
  return (
    <View className="h-14 justify-center px-4">
      <Text className="font-semibold text-2xl" accessibilityRole="header">
        {titre}
      </Text>
    </View>
  );
}
