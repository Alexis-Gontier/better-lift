import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useState } from "react";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { WorkoutSyncRunner } from "@/features/workouts/workout-sync-runner";

export default function RootLayout() {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30_000,
            // Le hors ligne est un cas nominal : inutile d'insister quand le
            // réseau manque. Ce qui ne doit pas se perdre — les séances — ne
            // passe pas par ces requêtes mais par la file d'envoi.
            retry: 1,
          },
        },
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>
      <SafeAreaProvider>
        <StatusBar style="light" />
        {/*
          La file appartient à l'application, pas à un écran : elle doit
          continuer de se vider pendant qu'on consulte son historique, et
          surtout survivre à la fermeture de l'écran de séance.
        */}
        <WorkoutSyncRunner />
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
