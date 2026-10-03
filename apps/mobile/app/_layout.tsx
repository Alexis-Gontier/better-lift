import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import {
  brancherReseauEtPremierPlan,
  gardeHorsLigne,
  persister,
  queryClient,
  UNE_SEMAINE,
} from "../lib/hors-ligne";
import { SeanceProvider } from "../lib/seance";

brancherReseauEtPremierPlan();

export default function RootLayout() {
  return (
    // Le glisser-déposer des exercices (édition d'une routine) exige la racine
    // de gestes au sommet de l'arbre.
    <GestureHandlerRootView style={{ flex: 1 }}>
      {/* Le cache des lectures survit à l'arrêt de l'app (D96) : routines,
          catalogue et précédents restent lisibles sans réseau. `buster` se monte
          quand la forme d'une réponse change, pour jeter un cache incompatible. */}
      <PersistQueryClientProvider
        client={queryClient}
        persistOptions={{
          persister,
          maxAge: UNE_SEMAINE,
          buster: "1",
          dehydrateOptions: { shouldDehydrateQuery: gardeHorsLigne },
        }}
      >
        <SeanceProvider>
          <StatusBar style="light" />
          <Stack
            screenOptions={{ headerShown: false, contentStyle: { backgroundColor: "#08090a" } }}
          >
            {/* Les onglets EN PREMIER : une pile qui déclare ses écrans prend le
              premier pour route initiale — déclarée seule, la modale ouvrait
              l'application. */}
            <Stack.Screen name="(onglets)" />
            {/* Le choix du bouton central flotte : il s'ouvre par-dessus les onglets. */}
            <Stack.Screen name="demarrer" options={{ presentation: "modal" }} />
            {/* Le catalogue s'ouvre par-dessus l'édition d'une routine, et y revient. */}
            <Stack.Screen name="choisir-exercices" options={{ presentation: "modal" }} />
            {/* L'ordre des exercices de la séance en cours (D89). */}
            <Stack.Screen name="reorganiser" options={{ presentation: "modal" }} />
          </Stack>
        </SeanceProvider>
      </PersistQueryClientProvider>
    </GestureHandlerRootView>
  );
}
