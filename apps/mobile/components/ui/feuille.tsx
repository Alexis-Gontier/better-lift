import type { LucideIcon } from "lucide-react-native";
import { Check } from "lucide-react-native";
import { useEffect } from "react";
import { Modal, Pressable, Text, View } from "react-native";
import { Gesture, GestureDetector, GestureHandlerRootView } from "react-native-gesture-handler";
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { creerStyles, espace, taille, useCouleurs } from "../../lib/theme";
import { Appuyable } from "./appuyable";

export type OptionFeuille = {
  libelle: string;
  icone?: LucideIcon;
  /** Le danger a sa couleur (D36) — jamais l'action ni le record. */
  danger?: boolean;
  /** Visible mais inerte, avec sa raison (« bientôt »). */
  inactive?: string;
  /** L'option en vigueur, cochée à droite. */
  choisie?: boolean;
  onPress?: () => void;
};

/** Tirée de 80 px vers le bas, ou lancée plus vite que 800 px/s, la feuille se ferme. */
const SEUIL_FERMETURE = 80;
const VITESSE_FERMETURE = 800;

/**
 * Une feuille qui monte du bas (D89), à la Hevy : les actions rares d'un
 * élément, sous le pouce. Elle se ferme AVANT d'exécuter l'option : une
 * confirmation ouverte par l'option ne s'empile pas sur la feuille.
 */
export function Feuille({
  visible,
  titre,
  message,
  options,
  onFermer,
}: {
  visible: boolean;
  titre?: string;
  /**
   * Une question, plus qu'un menu (confirmation) : le titre passe en encre et
   * en gras, le message l'explique dessous.
   */
  message?: string;
  options: OptionFeuille[];
  onFermer: () => void;
}) {
  const styles = useStyles();
  const couleurs = useCouleurs();
  const { bottom } = useSafeAreaInsets();
  // La feuille suit le doigt vers le bas, jamais vers le haut. Relâchée trop
  // tôt, elle revient ; au-delà du seuil, elle se ferme — le geste attendu de
  // toute feuille basse (Material, iOS), en plus du voile et du retour Android.
  const decalage = useSharedValue(0);
  useEffect(() => {
    if (visible) decalage.value = 0;
  }, [visible, decalage]);
  const glisser = Gesture.Pan()
    .runOnJS(true)
    // 10 px avant de s'activer : un appui sur une option reste un appui.
    .activeOffsetY(10)
    .onUpdate((e) => {
      decalage.value = Math.max(0, e.translationY);
    })
    .onEnd((e) => {
      if (e.translationY > SEUIL_FERMETURE || e.velocityY > VITESSE_FERMETURE) onFermer();
      else decalage.value = withTiming(0, { duration: 150 });
    });
  const suivre = useAnimatedStyle(() => ({ transform: [{ translateY: decalage.value }] }));
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      navigationBarTranslucent
      onRequestClose={onFermer}
    >
      {/* Sous Android, le contenu d'un Modal vit hors de la racine des gestes de
          l'app : il lui faut la sienne. */}
      <GestureHandlerRootView style={styles.racine}>
        <Pressable style={styles.voile} onPress={onFermer} accessibilityLabel="Fermer" />
        <GestureDetector gesture={glisser}>
          <Animated.View style={[styles.feuille, { paddingBottom: bottom + espace.s }, suivre]}>
            <View style={styles.poignee} />
            {message ? (
              <View style={styles.question}>
                <Text style={styles.questionTitre} accessibilityRole="header">
                  {titre}
                </Text>
                <Text style={styles.questionMessage}>{message}</Text>
              </View>
            ) : titre ? (
              <Text style={styles.titre} accessibilityRole="header" numberOfLines={1}>
                {titre}
              </Text>
            ) : null}
            {options.map((o) => {
              const Icone = o.icone;
              const couleur = o.inactive
                ? couleurs.encreAttenuee
                : o.danger
                  ? couleurs.dangerEncre
                  : couleurs.encre;
              return (
                <Appuyable
                  key={o.libelle}
                  disabled={Boolean(o.inactive)}
                  onPress={() => {
                    onFermer();
                    o.onPress?.();
                  }}
                  style={({ pressed }) => [styles.option, pressed && styles.appuyee]}
                  accessibilityRole="button"
                  accessibilityState={{ disabled: Boolean(o.inactive), selected: o.choisie }}
                >
                  {Icone ? <Icone size={20} color={couleur} /> : null}
                  <Text style={[styles.libelle, { color: couleur }]}>{o.libelle}</Text>
                  {o.inactive ? <Text style={styles.indication}>{o.inactive}</Text> : null}
                  {o.choisie ? <Check size={18} color={couleurs.encre} strokeWidth={2.6} /> : null}
                </Appuyable>
              );
            })}
          </Animated.View>
        </GestureDetector>
      </GestureHandlerRootView>
    </Modal>
  );
}

const useStyles = creerStyles((couleurs) => ({
  racine: { flex: 1 },
  voile: { flex: 1, backgroundColor: couleurs.voile },
  feuille: {
    backgroundColor: couleurs.surface2,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingHorizontal: espace.s,
    paddingTop: espace.s,
  },
  poignee: {
    alignSelf: "center",
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: couleurs.ligneForte,
    marginBottom: espace.s,
  },
  titre: {
    color: couleurs.encreTertiaire,
    fontSize: taille.petit,
    paddingHorizontal: espace.m,
    paddingVertical: espace.s,
  },
  question: { paddingHorizontal: espace.m, paddingTop: espace.xs, paddingBottom: espace.m, gap: 4 },
  questionTitre: { color: couleurs.encre, fontSize: taille.grand, fontWeight: "700" },
  questionMessage: { color: couleurs.encreSecondaire, fontSize: taille.courant, lineHeight: 22 },
  option: {
    minHeight: 48,
    flexDirection: "row",
    alignItems: "center",
    gap: espace.m,
    paddingHorizontal: espace.m,
    borderRadius: 10,
  },
  appuyee: { backgroundColor: couleurs.surface3 },
  libelle: { flex: 1, fontSize: taille.courant },
  indication: { color: couleurs.encreAttenuee, fontSize: taille.petit },
}));
