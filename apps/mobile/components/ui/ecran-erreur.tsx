import type { ErrorBoundaryProps } from "expo-router";
import { View } from "react-native";
import { Button } from "@/components/ui/button";
import { Ecran } from "@/components/ui/ecran";
import { Text } from "@/components/ui/text";

/**
 * Ce qu'Expo Router affiche quand un écran plante, au lieu d'un écran mort
 * dans l'APK. Il ne lit AUCUN contexte de l'application (séance, requêtes) :
 * c'est peut-être lui qui vient de planter. `retry` refait le rendu de la route.
 */
export function EcranErreur({
  error,
  retry,
  message = "L'écran n'a pas pu s'afficher. Réessaie ; si ça recommence, relance l'application.",
}: ErrorBoundaryProps & { message?: string }) {
  return (
    <Ecran className="flex-1 bg-background p-6">
      <View className="flex-1 justify-center gap-3" accessibilityRole="alert">
        <Text className="font-semibold text-2xl" accessibilityRole="header">
          Quelque chose s'est mal passé.
        </Text>
        <Text className="text-muted-foreground">{message}</Text>
        {__DEV__ ? <Text className="text-destructive text-sm">{error.message}</Text> : null}
      </View>
      <Button className="h-12" onPress={retry}>
        <Text>Réessayer</Text>
      </Button>
    </Ecran>
  );
}

/** La variante de la séance : ce qui compte, c'est que rien n'est perdu. */
export function EcranErreurSeance(props: ErrorBoundaryProps) {
  return (
    <EcranErreur
      {...props}
      message="Ta séance est gardée sur le téléphone : rien n'est perdu. Réessaie pour la reprendre."
    />
  );
}
