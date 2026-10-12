import { Redirect, Tabs } from "expo-router";
import { Dumbbell, type LucideIcon, User } from "lucide-react-native";
import { useEffect, useState } from "react";
import { type ColorValue, View } from "react-native";
import { BandeauSeance } from "../../components/bandeau-seance";
import { BarreOnglets } from "../../components/barre-onglets";
import { PreparerHorsLigne } from "../../components/preparer-hors-ligne";
import { authClient } from "../../lib/auth-client";
import { useCouleurs } from "../../lib/theme";

/**
 * Icônes Lucide, comme le web ; l'actif s'épaissit. L'haltère est redressée de
 * 45°, comme le logo (la rotation se pose sur une `View` : Lucide ignore `style`).
 */
const icone =
  (Icone: LucideIcon, redresser = false) =>
  ({ focused, color, size }: { focused: boolean; color: ColorValue; size: number }) => (
    <View style={redresser ? { transform: [{ rotate: "45deg" }] } : undefined}>
      <Icone color={color as string} size={size} strokeWidth={focused ? 2.4 : 1.8} />
    </View>
  );

/**
 * Les onglets (D179, D181), façon Hevy : Entraînement (démarrer et les routines)
 * et Profil, dans une barre classique (`BarreOnglets`). Le bandeau de la séance
 * en cours (D107) se pose au-dessus et ramène à la séance. La garde de session
 * vit ici : tout ce qui est sous les onglets exige un compte, et un seul endroit
 * le vérifie.
 */
export default function Onglets() {
  const couleurs = useCouleurs();
  const { data: session, isPending, error } = authClient.useSession();
  // Un cookie de session est-il gardé sur le téléphone ? `null` tant que le
  // stockage sécurisé n'a pas répondu.
  const [cookieGarde, setCookieGarde] = useState<boolean | null>(null);
  useEffect(() => {
    void authClient.getCookie().then((c) => setCookieGarde(Boolean(c)));
  }, []);

  // Moins d'une seconde en général : rien plutôt qu'un squelette qui clignote (NN/g).
  if (isPending || (error && cookieGarde === null)) {
    return <View style={{ flex: 1, backgroundColor: couleurs.canevas }} />;
  }
  // D100 : une erreur de lecture (hors ligne) ne renvoie pas à la connexion
  // QUAND un cookie de session est gardé sur le téléphone : la séance en cours
  // doit rester joignable en salle. Sans cookie, il n'y a jamais eu de compte
  // ici — une installation neuve ouverte hors ligne va à la connexion.
  if (!session && !(error && cookieGarde)) return <Redirect href="/connexion" />;

  return (
    <>
      {/* Hors ligne (D96) : remplir le cache tant qu'il y a du réseau. */}
      <PreparerHorsLigne />
      <Tabs
        // Le retour suit le chemin parcouru : la fiche d'un exercice ouverte depuis
        // une routine y ramène (D95).
        backBehavior="history"
        // Le bandeau de la séance en cours se pose AU-DESSUS de la barre, sur
        // tous les onglets et leurs écrans empilés (D107).
        tabBar={(props) => (
          <>
            <BandeauSeance />
            <BarreOnglets {...props} />
          </>
        )}
        screenOptions={{ headerShown: false, sceneStyle: { backgroundColor: couleurs.canevas } }}
      >
        {/* `/` redirige vers l'Entraînement, l'écran d'arrivée (D178). */}
        <Tabs.Screen name="index" options={{ href: null }} />
        <Tabs.Screen
          name="routines"
          options={{ title: "Entraînement", tabBarIcon: icone(Dumbbell, true) }}
        />
        <Tabs.Screen name="profil" options={{ title: "Profil", tabBarIcon: icone(User) }} />
        {/* La pile de la fiche d'un exercice. */}
        <Tabs.Screen name="exercices" options={{ href: null }} />
      </Tabs>
    </>
  );
}
