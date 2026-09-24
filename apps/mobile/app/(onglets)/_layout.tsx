import { Ionicons } from "@expo/vector-icons";
import { Redirect, Tabs } from "expo-router";
import type { ComponentProps } from "react";
import type { ColorValue } from "react-native";
import { Chargement } from "../../components/ui/etats";
import { authClient } from "../../lib/auth-client";
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
