import { ChevronDown } from "lucide-react-native";
import { Text, useWindowDimensions, View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  FadeIn,
  SlideInDown,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { formaterDuree } from "../../lib/temps";
import {
  affiche,
  CIBLE,
  creerStyles,
  espace,
  PLAFOND_TEXTE_DENSE,
  rayon,
  taille,
  useCouleurs,
} from "../../lib/theme";
import { Appuyable } from "../ui/appuyable";

/** Tirée de 80 px vers le bas, ou lancée plus vite que 800 px/s, l'horloge se réduit. */
const SEUIL = 80;
const VITESSE = 800;

/**
 * L'horloge de salle (D168), le geste signature : après une coche, le repos
 * monte du bas, décompte géant lisible téléphone posé sur le banc, et ce qui
 * vient ensuite. Glissée vers le bas (ou « Réduire »), elle redevient le
 * bandeau d'une ligne ; à zéro, l'écran de séance la ferme. Troisième exception
 * à l'orange (D162) : un temps d'effort, ni une action ni un record.
 */
export function HorlogeRepos({
  restant,
  total,
  ensuite,
  onPasser,
  onAjuster,
  onReduire,
}: {
  restant: number;
  /** La durée du repos à l'ouverture, ajustements compris : la barre en part. */
  total: number;
  /** « Rowing buste penché · 70 kg × 8 », ou rien en fin de séance. */
  ensuite: string | null;
  onPasser: () => void;
  onAjuster: (deltaSec: number) => void;
  onReduire: () => void;
}) {
  const styles = useStyles();
  const couleurs = useCouleurs();
  const { height } = useWindowDimensions();
  const { bottom } = useSafeAreaInsets();
  const reduit = useReducedMotion();
  const decalage = useSharedValue(0);
  const glisser = Gesture.Pan()
    .runOnJS(true)
    .activeOffsetY(10)
    .onUpdate((e) => {
      decalage.value = Math.max(0, e.translationY);
    })
    .onEnd((e) => {
      if (e.translationY > SEUIL || e.velocityY > VITESSE) onReduire();
      else decalage.value = withTiming(0, { duration: 150 });
    });
  const suivre = useAnimatedStyle(() => ({ transform: [{ translateY: decalage.value }] }));
  const ecoule = total > 0 ? Math.min(1, Math.max(0, 1 - restant / total)) : 1;

  return (
    <GestureDetector gesture={glisser}>
      <Animated.View
        entering={reduit ? FadeIn.duration(150) : SlideInDown.duration(250)}
        style={[
          styles.horloge,
          { height: height * 0.62, paddingBottom: bottom + espace.l },
          suivre,
        ]}
      >
        <View style={styles.tete}>
          <View style={styles.poignee} />
          <Appuyable
            onPress={onReduire}
            style={styles.reduire}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="Réduire le repos"
          >
            <ChevronDown size={24} color={couleurs.encreSecondaire} />
          </Appuyable>
        </View>

        <View style={styles.centre}>
          {/* Seul le libellé est annoncé : le décompte lu chaque seconde saturerait le lecteur d'écran. */}
          <Text
            maxFontSizeMultiplier={PLAFOND_TEXTE_DENSE}
            style={styles.libelle}
            accessibilityLiveRegion="polite"
          >
            {restant === 0 ? "Repos terminé" : "Repos"}
          </Text>
          <Text
            maxFontSizeMultiplier={PLAFOND_TEXTE_DENSE}
            style={styles.temps}
            numberOfLines={1}
            adjustsFontSizeToFit
            accessibilityLabel={`Repos restant ${formaterDuree(restant)}`}
          >
            {formaterDuree(restant)}
          </Text>
          <View style={styles.piste}>
            <View style={[styles.ecoule, { width: `${ecoule * 100}%` }]} />
          </View>
          {ensuite ? (
            <View style={styles.ensuite}>
              <Text maxFontSizeMultiplier={PLAFOND_TEXTE_DENSE} style={styles.ensuiteLibelle}>
                Ensuite
              </Text>
              <Text
                maxFontSizeMultiplier={PLAFOND_TEXTE_DENSE}
                style={styles.ensuiteTexte}
                numberOfLines={2}
              >
                {ensuite}
              </Text>
            </View>
          ) : null}
        </View>

        <View style={styles.boutons}>
          <Bouton
            libelle="−15 s"
            onPress={() => onAjuster(-15)}
            accessibilite="Retirer 15 secondes"
          />
          <Bouton
            libelle="+15 s"
            onPress={() => onAjuster(15)}
            accessibilite="Ajouter 15 secondes"
          />
          <Bouton libelle={restant === 0 ? "OK" : "Passer"} onPress={onPasser} />
        </View>
      </Animated.View>
    </GestureDetector>
  );
}

function Bouton({
  libelle,
  onPress,
  accessibilite,
}: {
  libelle: string;
  onPress: () => void;
  accessibilite?: string;
}) {
  const styles = useStyles();
  return (
    <Appuyable
      onPress={onPress}
      style={styles.bouton}
      accessibilityRole="button"
      accessibilityLabel={accessibilite}
    >
      <Text maxFontSizeMultiplier={PLAFOND_TEXTE_DENSE} style={styles.boutonTexte}>
        {libelle}
      </Text>
    </Appuyable>
  );
}

const useStyles = creerStyles((couleurs) => ({
  horloge: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: espace.l,
    paddingTop: espace.s,
    borderTopLeftRadius: rayon.feuille,
    borderTopRightRadius: rayon.feuille,
    backgroundColor: couleurs.surface1,
    borderTopWidth: 1,
    borderColor: couleurs.ligne,
    elevation: 16,
  },
  tete: { height: CIBLE, alignItems: "center", justifyContent: "center" },
  poignee: { width: 36, height: 4, borderRadius: 2, backgroundColor: couleurs.ligneForte },
  reduire: {
    position: "absolute",
    right: 0,
    width: CIBLE,
    height: CIBLE,
    alignItems: "center",
    justifyContent: "center",
  },
  centre: { flex: 1, justifyContent: "center", gap: espace.m },
  libelle: {
    color: couleurs.encreTertiaire,
    fontSize: taille.petit,
    fontWeight: "600",
    textAlign: "center",
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  temps: {
    ...affiche,
    color: couleurs.action,
    fontSize: 128,
    lineHeight: 128,
    textAlign: "center",
    fontVariant: ["tabular-nums"],
  },
  piste: { height: 6, borderRadius: 3, backgroundColor: couleurs.surface3, overflow: "hidden" },
  ecoule: { height: 6, backgroundColor: couleurs.action },
  ensuite: { alignItems: "center", gap: 2 },
  ensuiteLibelle: { color: couleurs.encreTertiaire, fontSize: taille.petit },
  ensuiteTexte: {
    color: couleurs.encre,
    fontSize: taille.courant + 1,
    fontWeight: "700",
    textAlign: "center",
  },
  boutons: { flexDirection: "row", gap: espace.s },
  bouton: {
    flex: 1,
    height: 56,
    borderRadius: rayon.bouton,
    backgroundColor: couleurs.surface2,
    alignItems: "center",
    justifyContent: "center",
  },
  boutonTexte: {
    color: couleurs.encre,
    fontSize: taille.courant,
    fontWeight: "700",
    fontVariant: ["tabular-nums"],
  },
}));
