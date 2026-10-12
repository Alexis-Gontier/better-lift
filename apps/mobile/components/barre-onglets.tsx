import type { BottomTabBarProps, BottomTabNavigationOptions } from "expo-router/tabs";
import { Text, View } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { creerStyles, useCouleurs } from "../lib/theme";
import { Appuyable } from "./ui/appuyable";

/** Le halo d'un appui : il naît sous le doigt, s'élargit et s'efface lentement. */
const DUREE_HALO = 800;

/**
 * La barre d'onglets (D181), classique : une icône et son libellé par onglet,
 * l'actif teinté de l'orange de l'app (`ongletActif`), les autres en encre
 * atténuée — iOS et Android disent la position par la teinte, sans indicateur.
 * Seuls les écrans qui déclarent une icône y figurent ; les piles masquées
 * (`href: null`) n'en ont pas.
 */
export function BarreOnglets({ state, descriptors, navigation }: BottomTabBarProps) {
  const styles = useStyles();
  const { bottom } = useSafeAreaInsets();
  return (
    <View style={[styles.barre, { paddingBottom: bottom }]} accessibilityRole="tablist">
      {state.routes.map((route, index) => {
        const { options } = descriptors[route.key];
        if (!options.tabBarIcon) return null;
        const actif = state.index === index;
        const appuyer = () => {
          const evenement = navigation.emit({
            type: "tabPress",
            target: route.key,
            canPreventDefault: true,
          });
          if (!actif && !evenement.defaultPrevented) navigation.navigate(route.name, route.params);
        };
        return <Onglet key={route.key} options={options} actif={actif} onPress={appuyer} />;
      })}
    </View>
  );
}

/**
 * Un onglet. Sous le doigt, un halo orange naît au centre, s'élargit et
 * s'efface — façon Basic-Fit —, ROGNÉ aux bords de l'onglet : il ne déborde
 * jamais de la barre. Animations réduites : il s'efface sans s'élargir.
 * L'onglet ne pâlit pas (style en fonction d'`Appuyable`).
 */
function Onglet({
  options,
  actif,
  onPress,
}: {
  options: BottomTabNavigationOptions;
  actif: boolean;
  onPress: () => void;
}) {
  const styles = useStyles();
  const couleurs = useCouleurs();
  const reduit = useReducedMotion();
  const opacite = useSharedValue(0);
  const echelle = useSharedValue(1);
  const halo = useAnimatedStyle(() => ({
    opacity: opacite.value,
    transform: [{ scale: echelle.value }],
  }));
  const allumer = () => {
    opacite.value = 0.22;
    opacite.value = withTiming(0, { duration: DUREE_HALO, easing: Easing.out(Easing.quad) });
    echelle.value = reduit ? 1 : 0.3;
    if (!reduit) {
      echelle.value = withTiming(1, { duration: DUREE_HALO, easing: Easing.out(Easing.cubic) });
    }
  };
  const teinte = actif ? couleurs.ongletActif : couleurs.encreAttenuee;
  const titre = typeof options.title === "string" ? options.title : "";

  return (
    <Appuyable
      onPress={onPress}
      onPressIn={allumer}
      style={() => styles.onglet}
      accessibilityRole="tab"
      accessibilityState={{ selected: actif }}
      accessibilityLabel={titre}
    >
      <Animated.View pointerEvents="none" style={[styles.halo, halo]} />
      {options.tabBarIcon?.({ focused: actif, color: teinte, size: 24 })}
      <Text style={[styles.libelle, { color: teinte }, actif && styles.libelleActif]}>{titre}</Text>
    </Appuyable>
  );
}

const useStyles = creerStyles((couleurs) => ({
  barre: {
    flexDirection: "row",
    backgroundColor: couleurs.surface1,
    borderTopWidth: 1,
    borderTopColor: couleurs.ligne,
  },
  onglet: {
    flex: 1,
    height: 60,
    alignItems: "center",
    justifyContent: "center",
    gap: 3,
    // Le halo reste dans l'onglet, donc dans la barre.
    overflow: "hidden",
  },
  halo: {
    position: "absolute",
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: couleurs.action,
  },
  libelle: { fontSize: 12, fontWeight: "500" },
  libelleActif: { fontWeight: "600" },
}));
