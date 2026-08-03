import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useState } from "react";
import { SafeAreaProvider } from "react-native-safe-area-context";

export default function RootLayout() {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30_000,
            // Le hors ligne est un cas nominal : inutile d'insister quand le
            // réseau manque, la file de retry arrivera en V1.
            retry: 1,
          },
        },
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>
      <SafeAreaProvider>
        <StatusBar style="light" />
        <Stack
          screenOptions={{
            headerStyle: { backgroundColor: "#101418" },
            headerTintColor: "#f2f4f6",
            contentStyle: { backgroundColor: "#101418" },
          }}
        >
          {/*
            Déclaré ici et non dans l'écran : `presentation` est lu au montage
            de la pile, un `Stack.Screen` posé depuis la route arriverait trop
            tard. Ajouter un exercice ne quitte pas la séance — la modale se
            pose par-dessus, et la séance reste montée dessous.
          */}
          <Stack.Screen name="workout/add-exercise" options={{ presentation: "modal" }} />
        </Stack>
      </SafeAreaProvider>
    </QueryClientProvider>
  );
}
