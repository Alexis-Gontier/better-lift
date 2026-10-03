import { Redirect, Tabs } from "expo-router";
import { BottomTabBar } from "expo-router/tabs";
import { ChartColumn, House, ListChecks, type LucideIcon, User } from "lucide-react-native";
import { useEffect, useState } from "react";
import { type ColorValue, Pressable, type PressableProps, Text } from "react-native";
import { BandeauSeance } from "../../components/bandeau-seance";
import { PreparerHorsLigne } from "../../components/preparer-hors-ligne";
import { Chargement } from "../../components/ui/etats";
import { authClient } from "../../lib/auth-client";
import { polices, useCouleurs } from "../../lib/theme";

/**
 * Icônes Lucide, comme le web. L'onglet actif s'épaissit : avec la couleur,
 * c'est la forme qui dit la position.
 */
const icone =
  (Icone: LucideIcon) =>
  ({ focused, color }: { focused: boolean; color: ColorValue }) => (
    <Icone color={color as string} size={24} strokeWidth={focused ? 2.4 : 1.8} />
  );

/**
 * Les quatre onglets (D106), sans lime : l'écran garde son seul aplat (D105).
 * « Démarrer » vit sur l'Accueil et la page d'une routine ; la séance en cours
 * se reprend par le bandeau posé au-dessus de la barre (D107). La garde de
 * session vit ici : tout ce qui est sous les onglets exige un compte, et un seul
 * endroit le vérifie.
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

  if (isPending || (error && cookieGarde === null)) return <Chargement />;
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
        // le détail d'une séance y ramène, et non à l'Accueil (D95).
        backBehavior="history"
        // Le bandeau de la séance en cours se pose AU-DESSUS de la barre, sur
        // tous les onglets et leurs écrans empilés : un seul mécanisme (D107).
        tabBar={(props) => (
          <>
            <BandeauSeance />
            <BottomTabBar {...props} />
          </>
        )}
        screenOptions={{
          headerShown: false,
          sceneStyle: { backgroundColor: couleurs.canevas },
          // L'onglet actif en encre (D106, remplace D76 révisée) : le lime reste
          // à l'action et au record. La forme dit aussi la position — trait
          // épaissi, libellé en gras.
          tabBarActiveTintColor: couleurs.encre,
          tabBarInactiveTintColor: couleurs.encreAttenuee,
          // Toute la largeur du bas, jusque sous la zone de geste : une marche
          // au-dessus du canevas, séparée par un filet. Pas de hauteur fixe : Expo
          // Router y ajoute la marge de la zone de geste d'Android, qu'une hauteur
          // imposée recouvrirait.
          tabBarStyle: {
            backgroundColor: couleurs.surface1,
            borderTopWidth: 1,
            borderTopColor: couleurs.ligne,
            paddingTop: 8,
          },
          // Le libellé actif passe en gras : la position ne tient pas qu'à la couleur.
          tabBarLabel: ({ focused, color, children }) => (
            <Text
              style={{
                color,
                fontSize: 11,
                marginTop: 2,
                fontFamily: focused ? polices.gras : polices.moyen,
              }}
            >
              {children}
            </Text>
          ),
          // Aucun retour visuel à l'appui (ni ondulation Android, ni opacité) :
          // l'onglet actif se signale déjà par sa couleur.
          tabBarButton: ({ ref: _ref, ...props }) => (
            <Pressable {...(props as PressableProps)} android_ripple={null} />
          ),
        }}
      >
        <Tabs.Screen name="index" options={{ title: "Accueil", tabBarIcon: icone(House) }} />
        <Tabs.Screen
          name="routines"
          options={{ title: "Routines", tabBarIcon: icone(ListChecks) }}
        />
        <Tabs.Screen name="stats" options={{ title: "Stats", tabBarIcon: icone(ChartColumn) }} />
        <Tabs.Screen name="profil" options={{ title: "Profil", tabBarIcon: icone(User) }} />
        {/* L'historique quitte la barre ; ses écrans restent, joignables par lien,
          le temps de décider où il vivra. */}
        <Tabs.Screen name="historique" options={{ href: null }} />
        {/* Les exercices cèdent leur place aux Stats ; leurs écrans restent. */}
        <Tabs.Screen name="exercices" options={{ href: null }} />
      </Tabs>
    </>
  );
}
