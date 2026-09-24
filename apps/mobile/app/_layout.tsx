import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SeanceProvider } from "../lib/seance";

const queryClient = new QueryClient();

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <SeanceProvider>
        <StatusBar style="light" />
        <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: "#08090a" } }}>
          {/* Les onglets EN PREMIER : une pile qui déclare ses écrans prend le
              premier pour route initiale — déclarée seule, la modale ouvrait
              l'application. */}
          <Stack.Screen name="(onglets)" />
          {/* Le choix du bouton central flotte : il s'ouvre par-dessus les onglets. */}
          <Stack.Screen name="demarrer" options={{ presentation: "modal" }} />
        </Stack>
      </SeanceProvider>
    </QueryClientProvider>
  );
}
