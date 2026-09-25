import { Redirect, Tabs, useRouter } from "expo-router";
import {
  ChartColumn,
  Dumbbell,
  House,
  ListChecks,
  type LucideIcon,
  Play,
  User,
} from "lucide-react-native";
import {
  type ColorValue,
  Pressable,
  type PressableProps,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Chargement } from "../../components/ui/etats";
import { authClient } from "../../lib/auth-client";
import { useSeance } from "../../lib/seance";
import { couleurs } from "../../lib/theme";

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
 * Les onglets (D74), façon opengym : deux liens de chaque côté, l'action au
 * centre. La garde de session vit ici : tout ce qui est sous les onglets exige
 * un compte, et un seul endroit le vérifie.
 */
export default function Onglets() {
  const { data: session, isPending } = authClient.useSession();
  const router = useRouter();
  const { seance } = useSeance();
  // Le bouton central : reprendre la séance en cours, sinon choisir comment démarrer.
  const lancer = () => router.push(seance ? "/seance" : "/demarrer");

  if (isPending) return <Chargement />;
  if (!session) return <Redirect href="/connexion" />;

  const Centrale = seance ? Play : Dumbbell;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        sceneStyle: { backgroundColor: couleurs.canvas },
        // L'onglet actif prend la couleur de l'application (choix de
        // l'utilisateur, D76 révisée) ; les autres restent en encre faible.
        tabBarActiveTintColor: couleurs.accent,
        tabBarInactiveTintColor: couleurs.encreFaible,
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
        tabBarLabelStyle: { fontSize: 11, fontWeight: "600", marginTop: 2 },
        // Aucun retour visuel à l'appui (ni ondulation Android, ni opacité) :
        // l'onglet actif se signale déjà par sa couleur.
        tabBarButton: ({ ref: _ref, ...props }) => (
          <Pressable {...(props as PressableProps)} android_ripple={null} />
        ),
      }}
    >
      <Tabs.Screen name="index" options={{ title: "Accueil", tabBarIcon: icone(House) }} />
      <Tabs.Screen name="routines" options={{ title: "Routines", tabBarIcon: icone(ListChecks) }} />
      {/* Au centre, l'action du moment : un aplat lime (D28), plus grand que les
          onglets et qui déborde au-dessus de la barre. */}
      <Tabs.Screen
        name="lancer"
        options={{
          tabBarButton: () => (
            <Pressable
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
                      <Centrale color={couleurs.surAccent} size={26} strokeWidth={2.4} />
                    </View>
                  </View>
                  <Text style={styles.libelle}>{seance ? "Reprendre" : "Démarrer"}</Text>
                </>
              )}
            </Pressable>
          ),
        }}
      />
      <Tabs.Screen name="stats" options={{ title: "Stats", tabBarIcon: icone(ChartColumn) }} />
      <Tabs.Screen name="profil" options={{ title: "Profil", tabBarIcon: icone(User) }} />
      {/* L'historique quitte la barre ; ses écrans restent, joignables par lien,
          le temps de décider où il vivra. */}
      <Tabs.Screen name="historique" options={{ href: null }} />
      {/* Les exercices cèdent leur place aux Stats ; leurs écrans restent. */}
      <Tabs.Screen name="exercices" options={{ href: null }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  // Le libellé central s'aligne sur ceux des onglets : la barre réserve sous
  // chaque libellé une marge que ce bouton personnalisé ne reçoit pas.
  place: { flex: 1, alignItems: "center", justifyContent: "flex-end", marginBottom: -8 },
  central: {
    width: 60,
    height: 60,
    marginTop: -30,
    borderRadius: 30,
    backgroundColor: couleurs.accent,
    alignItems: "center",
    justifyContent: "center",
  },
  redresse: { transform: [{ rotate: "45deg" }] },
  // En encre, pas en lime : le lime en texte est le registre du record (D28).
  libelle: { color: couleurs.encre, fontSize: 11, fontWeight: "600", marginTop: 4 },
});
