import "../global.css";
import { PortalHost } from "@rn-primitives/portal";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { useCSSVariable } from "uniwind";
import { ConfirmationProvider } from "../lib/confirmation";
import {
  brancherReseauEtPremierPlan,
  gardeHorsLigne,
  persister,
  queryClient,
  UNE_SEMAINE,
} from "../lib/hors-ligne";
import { SeanceProvider } from "../lib/seance";
import { appliquerThemeGarde } from "../lib/theme-choix";

// Le thème choisi dans le Profil (D128), appliqué dès le chargement : avant le
// premier écran, pas après un clignotement dans le thème du système.
void appliquerThemeGarde();

// Un écran qui plante affiche une issue plutôt qu'un écran mort ; les routes
// qui ont la leur (la séance) l'emportent sur celle-ci.
export { EcranErreur as ErrorBoundary } from "../components/ui/ecran-erreur";

brancherReseauEtPremierPlan();

export default function RootLayout() {
  // Le fond des écrans pendant les transitions : le token, lu par Uniwind (D316).
  const fond = useCSSVariable("--color-background") as string | undefined;

  return (
    // Le glisser-déposer (réorganiser la séance) exige la racine
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
          buster: "3",
          dehydrateOptions: { shouldDehydrateQuery: gardeHorsLigne },
        }}
      >
        <SeanceProvider>
          <ConfirmationProvider>
            <StatusBar style="auto" />
            <Stack
              screenOptions={{
                headerShown: false,
                contentStyle: { backgroundColor: fond },
              }}
            >
              {/* L'accueil EN PREMIER : une pile qui déclare ses écrans prend le
              premier pour route initiale — déclarée seule, la modale ouvrait
              l'application. */}
              <Stack.Screen name="(connecte)" />
              {/* Le catalogue s'ouvre par-dessus la séance, et y revient. */}
              <Stack.Screen name="choisir-exercices" options={{ presentation: "modal" }} />
              {/* L'ordre des exercices de la séance en cours (D89). */}
              <Stack.Screen name="reorganiser" options={{ presentation: "modal" }} />
            </Stack>
            {/* Les menus et fenêtres de Reusables s'y rendent (D316). */}
            <PortalHost />
          </ConfirmationProvider>
        </SeanceProvider>
      </PersistQueryClientProvider>
    </GestureHandlerRootView>
  );
}
