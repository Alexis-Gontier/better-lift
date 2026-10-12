import { Redirect, Tabs } from "expo-router";
import { BottomTabBar } from "expo-router/tabs";
import { Dumbbell, type LucideIcon, User } from "lucide-react-native";
import { createContext, type ReactNode, useContext, useEffect, useState } from "react";
import { type ColorValue, type PressableProps, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BandeauSeance } from "../../components/bandeau-seance";
import { PreparerHorsLigne } from "../../components/preparer-hors-ligne";
import { Appuyable } from "../../components/ui/appuyable";
import { authClient } from "../../lib/auth-client";
import { creerStyles, polices, useCouleurs } from "../../lib/theme";

/** L'onglet est-il sous le doigt ? Posé par le bouton, lu par sa pilule. */
const Appuye = createContext(false);

/**
 * Icônes Lucide, comme le web. L'onglet actif se pose dans une pilule (D165,
 * Material 3) et s'épaissit : c'est la forme qui dit la position, pas la couleur.
 * L'haltère est redressée de 45°, comme le logo.
 */
const icone =
  (Icone: LucideIcon, redresser = false) =>
  ({ focused, color }: { focused: boolean; color: ColorValue }) => (
    <PiluleOnglet active={focused}>
      <View style={redresser ? { transform: [{ rotate: "45deg" }] } : undefined}>
        <Icone color={color as string} size={22} strokeWidth={focused ? 2.4 : 1.8} />
      </View>
    </PiluleOnglet>
  );

/**
 * Sous le doigt, une couche d'état teinte la pilule (D179, Material 3) : l'encre
 * à 10 % par-dessus son fond. L'icône et le libellé restent nets — pâlir tout
 * l'onglet délavait la pilule active.
 */
function PiluleOnglet({ active, children }: { active: boolean; children: ReactNode }) {
  const styles = useStyles();
  const appuye = useContext(Appuye);
  return (
    <View style={[styles.pilule, active && styles.piluleActive]}>
      {appuye ? <View style={styles.coucheEtat} /> : null}
      {children}
    </View>
  );
}

/** Le bouton d'un onglet : il dit à sa pilule qu'il est appuyé, sans pâlir lui-même. */
function BoutonOnglet({
  ref: _ref,
  children,
  style,
  ...props
}: PressableProps & { ref?: unknown }) {
  return (
    // Un style en fonction : `Appuyable` laisse l'état appuyé à la pilule.
    <Appuyable
      {...props}
      style={typeof style === "function" ? style : () => style}
      android_ripple={null}
    >
      {({ pressed }) => <Appuye.Provider value={pressed}>{children as ReactNode}</Appuye.Provider>}
    </Appuyable>
  );
}

/**
 * Les onglets (D179), façon Hevy : Entraînement (démarrer et les routines) et
 * Profil — des destinations seulement, plus d'action au centre. Le bandeau de la
 * séance en cours (D107) reste posé au-dessus et ramène à la séance. La garde de
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
  const { bottom } = useSafeAreaInsets();

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
            <BottomTabBar {...props} />
          </>
        )}
        screenOptions={{
          headerShown: false,
          sceneStyle: { backgroundColor: couleurs.canevas },
          // L'onglet actif à l'encre, les autres en encre faible (D165).
          tabBarActiveTintColor: couleurs.ongletActif,
          tabBarInactiveTintColor: couleurs.encreAttenuee,
          // Toute la largeur du bas, jusque sous les boutons du système : une marche
          // au-dessus du canevas, séparée par un filet. Expo Router fixe la hauteur
          // à 49 + la marge du bas : sans l'ajouter ici, le `paddingTop` serait pris
          // sur les 49 et les libellés glisseraient sous les boutons d'Android.
          tabBarStyle: {
            height: 49 + 8 + bottom,
            backgroundColor: couleurs.surface1,
            borderTopWidth: 1,
            borderTopColor: couleurs.ligne,
            paddingTop: 8,
          },
          tabBarLabelStyle: { fontSize: 11, fontFamily: polices.demiGras, marginTop: 2 },
          tabBarButton: (props) => <BoutonOnglet {...(props as PressableProps)} />,
        }}
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

const useStyles = creerStyles((couleurs) => ({
  pilule: {
    width: 56,
    height: 30,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  piluleActive: { backgroundColor: couleurs.surface3 },
  coucheEtat: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: couleurs.encre,
    opacity: 0.1,
  },
}));
