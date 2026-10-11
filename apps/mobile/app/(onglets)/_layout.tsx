import { Redirect, Tabs, useRouter } from "expo-router";
import { BottomTabBar } from "expo-router/tabs";
import {
  ChartColumn,
  Dumbbell,
  House,
  ListChecks,
  type LucideIcon,
  Play,
  User,
} from "lucide-react-native";
import { type ReactNode, useEffect, useState } from "react";
import { type ColorValue, type PressableProps, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BandeauSeance } from "../../components/bandeau-seance";
import { FeuilleDemarrer } from "../../components/feuille-demarrer";
import { PreparerHorsLigne } from "../../components/preparer-hors-ligne";
import { Appuyable } from "../../components/ui/appuyable";
import { authClient } from "../../lib/auth-client";
import { useSeance } from "../../lib/seance";
import { creerStyles, polices, useCouleurs } from "../../lib/theme";

/**
 * Icônes Lucide, comme le web. L'onglet actif se pose dans une pilule (D165,
 * Material 3) et s'épaissit : c'est la forme qui dit la position, pas la couleur.
 */
const icone =
  (Icone: LucideIcon) =>
  ({ focused, color }: { focused: boolean; color: ColorValue }) => (
    <PiluleOnglet active={focused}>
      <Icone color={color as string} size={22} strokeWidth={focused ? 2.4 : 1.8} />
    </PiluleOnglet>
  );

function PiluleOnglet({ active, children }: { active: boolean; children: ReactNode }) {
  const styles = useStyles();
  return <View style={[styles.pilule, active && styles.piluleActive]}>{children}</View>;
}

/**
 * Les onglets (D74), façon opengym : deux liens de chaque côté, l'action au
 * centre — rétablis à la demande de l'utilisateur, qui les préfère à la barre
 * sans aplat de D106. Le bandeau de la séance en cours (D107) reste posé
 * au-dessus. La garde de session vit ici : tout ce qui est sous les onglets
 * exige un compte, et un seul endroit le vérifie.
 */
export default function Onglets() {
  const styles = useStyles();
  const couleurs = useCouleurs();
  const { data: session, isPending, error } = authClient.useSession();
  // Un cookie de session est-il gardé sur le téléphone ? `null` tant que le
  // stockage sécurisé n'a pas répondu.
  const [cookieGarde, setCookieGarde] = useState<boolean | null>(null);
  useEffect(() => {
    void authClient.getCookie().then((c) => setCookieGarde(Boolean(c)));
  }, []);
  const router = useRouter();
  const { bottom } = useSafeAreaInsets();
  const { seance } = useSeance();
  // Le bouton central : reprendre la séance en cours, sinon choisir comment démarrer.
  const [demarrer, setDemarrer] = useState(false);
  const lancer = () => (seance ? router.push("/seance") : setDemarrer(true));

  // Moins d'une seconde en général : rien plutôt qu'un squelette qui clignote (NN/g).
  if (isPending || (error && cookieGarde === null)) {
    return <View style={{ flex: 1, backgroundColor: couleurs.canevas }} />;
  }
  // D100 : une erreur de lecture (hors ligne) ne renvoie pas à la connexion
  // QUAND un cookie de session est gardé sur le téléphone : la séance en cours
  // doit rester joignable en salle. Sans cookie, il n'y a jamais eu de compte
  // ici — une installation neuve ouverte hors ligne va à la connexion.
  if (!session && !(error && cookieGarde)) return <Redirect href="/connexion" />;

  const Centrale = seance ? Play : Dumbbell;

  return (
    <>
      {/* Hors ligne (D96) : remplir le cache tant qu'il y a du réseau. */}
      <PreparerHorsLigne />
      <FeuilleDemarrer visible={demarrer} onFermer={() => setDemarrer(false)} />
      <Tabs
        // Le retour suit le chemin parcouru : la fiche d'un exercice ouverte depuis
        // le détail d'une séance y ramène, et non à l'Accueil (D95).
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
          // L'onglet actif à l'encre, les autres en encre faible (D165) ;
          // l'indicateur en pilule de Material 3 arrive au lot 2.
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
          // L'appui pâlit l'onglet (Appuyable), sans ondulation Android qui
          // déborderait de la barre.
          tabBarButton: ({ ref: _ref, ...props }) => (
            <Appuyable {...(props as PressableProps)} android_ripple={null} />
          ),
        }}
      >
        <Tabs.Screen name="index" options={{ title: "Accueil", tabBarIcon: icone(House) }} />
        <Tabs.Screen
          name="routines"
          options={{ title: "Routines", tabBarIcon: icone(ListChecks) }}
        />
        {/* Au centre, l'action du moment : un aplat orange (D28), plus grand que les
          onglets et qui déborde au-dessus de la barre. */}
        <Tabs.Screen
          name="lancer"
          options={{
            tabBarButton: () => (
              <Appuyable
                onPress={lancer}
                style={styles.place}
                accessibilityRole="button"
                accessibilityLabel={seance ? "Reprendre la séance" : "Démarrer une séance"}
              >
                {() => (
                  <>
                    <View style={styles.central}>
                      {/* L'haltère de Lucide est dessinée en diagonale : redressée de
                        45° pour se lire à l'horizontale, comme une barre posée. */}
                      <View style={seance ? undefined : styles.redresse}>
                        <Centrale color={couleurs.surAction} size={26} strokeWidth={2.4} />
                      </View>
                    </View>
                    <Text style={styles.libelle}>{seance ? "Reprendre" : "Démarrer"}</Text>
                  </>
                )}
              </Appuyable>
            ),
          }}
        />
        <Tabs.Screen name="stats" options={{ title: "Stats", tabBarIcon: icone(ChartColumn) }} />
        <Tabs.Screen name="profil" options={{ title: "Profil", tabBarIcon: icone(User) }} />
        {/* La pile du détail d'une séance, ouvert depuis le fil de l'Accueil (D117). */}
        <Tabs.Screen name="historique" options={{ href: null }} />
        {/* La pile de la fiche d'un exercice ; la bibliothèque est une vue de Routines (D121). */}
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
  },
  piluleActive: { backgroundColor: couleurs.surface3 },
  // Posé en bas de la place, le libellé central s'aligne sur ceux des onglets.
  place: { flex: 1, alignItems: "center", justifyContent: "flex-end" },
  central: {
    width: 60,
    height: 60,
    marginTop: -30,
    borderRadius: 30,
    backgroundColor: couleurs.action,
    alignItems: "center",
    justifyContent: "center",
  },
  redresse: { transform: [{ rotate: "45deg" }] },
  // En encre, pas en orange : l'orange en texte est le registre du record (D28).
  libelle: { color: couleurs.encre, fontSize: 11, fontWeight: "600", marginTop: 4 },
}));
