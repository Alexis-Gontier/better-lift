import { Ionicons } from "@expo/vector-icons";
import { Redirect, Tabs, useRouter } from "expo-router";
import type { ComponentProps } from "react";
import { type ColorValue, Pressable, StyleSheet, View } from "react-native";
import { Chargement } from "../../components/ui/etats";
import { authClient } from "../../lib/auth-client";
import { useSeance } from "../../lib/seance";
import { couleurs } from "../../lib/theme";

type Icone = ComponentProps<typeof Ionicons>["name"];

/** Icône pleine quand l'onglet est actif, contour sinon : la forme dit la position. */
const icone =
  (plein: Icone, contour: Icone) =>
  ({ focused, color, size }: { focused: boolean; color: ColorValue; size: number }) => (
    <Ionicons name={focused ? plein : contour} color={color as string} size={size} />
  );

/**
 * Les quatre onglets (D74). La garde de session vit ici : tout ce qui est sous
 * les onglets exige un compte, et un seul endroit le vérifie.
 */
export default function Onglets() {
  const { data: session, isPending } = authClient.useSession();
  const router = useRouter();
  const { seance } = useSeance();
  // Le bouton central : reprendre la séance en cours, sinon choisir comment démarrer.
  const lancer = () => router.push(seance ? "/seance" : "/demarrer");

  if (isPending) return <Chargement />;
  if (!session) return <Redirect href="/connexion" />;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        sceneStyle: { backgroundColor: couleurs.canvas },
        // L'onglet actif est en encre pleine, jamais en lime (D76) : une position
        // n'est pas une action.
        tabBarActiveTintColor: couleurs.encre,
        tabBarInactiveTintColor: couleurs.encreFaible,
        tabBarStyle: {
          backgroundColor: couleurs.canvas,
          borderTopColor: couleurs.ligne,
          // Pas de hauteur fixe : Expo Router y ajoute la marge de la zone de
          // geste d'Android, qu'une hauteur imposée recouvrirait.
          paddingTop: 6,
        },
        tabBarLabelStyle: { fontSize: 12 },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{ title: "Accueil", tabBarIcon: icone("barbell", "barbell-outline") }}
      />
      <Tabs.Screen
        name="historique"
        options={{ title: "Historique", tabBarIcon: icone("time", "time-outline") }}
      />
      {/* Au centre, façon opengym : l'action du moment, en aplat lime (D28).
          Deux liens de chaque côté. */}
      <Tabs.Screen
        name="lancer"
        options={{
          title: seance ? "Reprendre" : "Démarrer",
          tabBarButton: () => (
            <View style={styles.place}>
              <Pressable
                onPress={lancer}
                style={({ pressed }) => [styles.central, pressed && { opacity: 0.85 }]}
                accessibilityRole="button"
                accessibilityLabel={seance ? "Reprendre la séance" : "Démarrer une séance"}
              >
                <Ionicons name={seance ? "play" : "add"} size={32} color={couleurs.surAccent} />
              </Pressable>
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="exercices"
        options={{ title: "Exercices", tabBarIcon: icone("list", "list-outline") }}
      />
      <Tabs.Screen
        name="profil"
        options={{ title: "Profil", tabBarIcon: icone("person", "person-outline") }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  place: { flex: 1, alignItems: "center", justifyContent: "center" },
  // Plus grand que les onglets et légèrement surélevé : c'est l'action.
  central: {
    width: 58,
    height: 58,
    marginTop: -18,
    borderRadius: 29,
    backgroundColor: couleurs.accent,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 4,
    borderColor: couleurs.canvas,
  },
});
