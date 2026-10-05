import {
  Archivo_500Medium,
  Archivo_600SemiBold,
  Archivo_700Bold,
  Archivo_800ExtraBold,
  useFonts,
} from "@expo-google-fonts/archivo";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { ConfirmationProvider } from "../lib/confirmation";
import {
  brancherReseauEtPremierPlan,
  gardeHorsLigne,
  persister,
  queryClient,
  UNE_SEMAINE,
} from "../lib/hors-ligne";
import { SeanceProvider } from "../lib/seance";
import { polices, useCouleurs } from "../lib/theme";
import { appliquerThemeGarde } from "../lib/theme-choix";

// Le thème choisi dans le Profil (D128), appliqué dès le chargement : avant le
// premier écran, pas après un clignotement dans le thème du système.
void appliquerThemeGarde();

// Un écran qui plante affiche une issue plutôt qu'un écran mort ; les routes
// qui ont la leur (la séance) l'emportent sur celle-ci.
export { EcranErreur as ErrorBoundary } from "../components/ui/ecran-erreur";

brancherReseauEtPremierPlan();
// L'écran de démarrage reste affiché jusqu'au chargement des polices : sans lui,
// le premier écran s'afficherait une fraction de seconde dans la police système.
void SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const couleurs = useCouleurs();
  const [policesPretes, erreurPolices] = useFonts({
    Archivo_500Medium,
    Archivo_600SemiBold,
    Archivo_700Bold,
    Archivo_800ExtraBold,
    [polices.condense]: require("../assets/polices/ArchivoCondense-Bold.ttf"),
  });
  // Une police qui ne charge pas ne doit pas bloquer l'app : elle s'affiche dans
  // la police système plutôt que de rester sur l'écran de démarrage.
  const pret = policesPretes || erreurPolices !== null;
  useEffect(() => {
    if (pret) void SplashScreen.hideAsync();
  }, [pret]);
  if (!pret) return null;

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
          buster: "2",
          dehydrateOptions: { shouldDehydrateQuery: gardeHorsLigne },
        }}
      >
        <SeanceProvider>
          <ConfirmationProvider>
            <StatusBar style="auto" />
            <Stack
              screenOptions={{
                headerShown: false,
                contentStyle: { backgroundColor: couleurs.canevas },
              }}
            >
              {/* Les onglets EN PREMIER : une pile qui déclare ses écrans prend le
              premier pour route initiale — déclarée seule, la modale ouvrait
              l'application. */}
              <Stack.Screen name="(onglets)" />
              {/* Le catalogue s'ouvre par-dessus l'édition d'une routine, et y revient. */}
              <Stack.Screen name="choisir-exercices" options={{ presentation: "modal" }} />
              {/* L'ordre des exercices de la séance en cours (D89). */}
              <Stack.Screen name="reorganiser" options={{ presentation: "modal" }} />
            </Stack>
          </ConfirmationProvider>
        </SeanceProvider>
      </PersistQueryClientProvider>
    </GestureHandlerRootView>
  );
}
