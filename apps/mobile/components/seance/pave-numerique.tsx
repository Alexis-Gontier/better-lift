import type { ChampPave, TouchePave } from "@better-lift/shared";
import { ChevronDown, Delete } from "lucide-react-native";
import { Pressable, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { CIBLE, creerStyles, espace, polices, rayon, taille, useCouleurs } from "../../lib/theme";
import { UNITE } from "../../lib/unites";

const TOUCHES: TouchePave[] = ["1", "2", "3", "4", "5", "6", "7", "8", "9", ",", "0"];

/**
 * Le pavé de la séance (D109), à la place du clavier système qui masquait la
 * moitié de l'écran. Il écrit dans la case de la ligne, cerclée d'encre ; la
 * charge s'y ajuste de ±2,5 au pouce, « Suivant » passe aux reps, « Valider la
 * série » coche la ligne et ferme le pavé.
 */
export function PaveNumerique({
  champ,
  serie,
  texte,
  invalide,
  onTouche,
  onEffacer,
  onAjuster,
  onSuivant,
  onValider,
  onFermer,
}: {
  champ: ChampPave;
  /** « 2 », « É » : l'étiquette de la série en cours de saisie. */
  serie: string;
  texte: string;
  invalide: boolean;
  onTouche: (t: TouchePave) => void;
  onEffacer: () => void;
  onAjuster: (pas: number) => void;
  onSuivant: () => void;
  onValider: () => void;
  onFermer: () => void;
}) {
  const styles = useStyles();
  const couleurs = useCouleurs();
  // Au-dessus de la barre de gestes du système, jamais dessous.
  const { bottom } = useSafeAreaInsets();
  const charge = champ === "charge";

  return (
    <View style={[styles.pave, { paddingBottom: espace.m + bottom }]}>
      <View style={styles.entete}>
        <View style={styles.titre}>
          <Text style={styles.libelle}>
            {charge ? `Charge (${UNITE})` : "Répétitions"} · série {serie}
          </Text>
          <Text
            style={[styles.valeur, invalide && styles.valeurKo]}
            accessibilityLiveRegion="polite"
          >
            {texte || "—"}
          </Text>
        </View>
        {charge ? (
          <View style={styles.pas}>
            <Touche texte="−2,5" onPress={() => onAjuster(-2.5)} etroite />
            <Touche texte="+2,5" onPress={() => onAjuster(2.5)} etroite />
          </View>
        ) : null}
        <Pressable
          onPress={onFermer}
          hitSlop={8}
          style={styles.fermer}
          accessibilityRole="button"
          accessibilityLabel="Fermer le pavé"
        >
          <ChevronDown size={24} color={couleurs.encreSecondaire} />
        </Pressable>
      </View>

      <View style={styles.grille}>
        {TOUCHES.map((t) => (
          <Touche
            key={t}
            texte={t}
            // Pas de virgule dans des répétitions.
            inactive={t === "," && !charge}
            onPress={() => onTouche(t)}
          />
        ))}
        <Pressable
          onPress={onEffacer}
          style={({ pressed }) => [styles.touche, pressed && styles.toucheAppuyee]}
          accessibilityRole="button"
          accessibilityLabel="Effacer"
        >
          <Delete size={22} color={couleurs.encre} />
        </Pressable>
      </View>

      <View style={styles.actions}>
        {charge ? (
          <Pressable
            onPress={onSuivant}
            style={({ pressed }) => [styles.secondaire, pressed && styles.toucheAppuyee]}
            accessibilityRole="button"
          >
            <Text style={styles.secondaireTexte}>Suivant · reps</Text>
          </Pressable>
        ) : null}
        <Pressable
          onPress={onValider}
          disabled={invalide}
          style={({ pressed }) => [
            styles.valider,
            invalide && styles.validerInactif,
            pressed && styles.validerAppuye,
          ]}
          accessibilityRole="button"
          accessibilityState={{ disabled: invalide }}
        >
          <Text style={styles.validerTexte}>Valider la série</Text>
        </Pressable>
      </View>
    </View>
  );
}

function Touche({
  texte,
  onPress,
  inactive,
  etroite,
}: {
  texte: string;
  onPress: () => void;
  inactive?: boolean;
  etroite?: boolean;
}) {
  const styles = useStyles();
  return (
    <Pressable
      onPress={onPress}
      disabled={inactive}
      style={({ pressed }) => [
        styles.touche,
        etroite && styles.toucheEtroite,
        pressed && styles.toucheAppuyee,
        inactive && styles.toucheInactive,
      ]}
      accessibilityRole="button"
      accessibilityLabel={texte === "," ? "Virgule" : texte}
    >
      <Text style={styles.toucheTexte}>{texte}</Text>
    </Pressable>
  );
}

const useStyles = creerStyles((couleurs) => ({
  pave: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    paddingTop: espace.m,
    paddingHorizontal: espace.m,
    gap: espace.m,
    borderTopLeftRadius: rayon.feuille,
    borderTopRightRadius: rayon.feuille,
    backgroundColor: couleurs.surface1,
    borderTopWidth: 1,
    borderColor: couleurs.ligneForte,
    elevation: 16,
  },
  entete: { flexDirection: "row", alignItems: "center", gap: espace.s },
  titre: { flex: 1 },
  libelle: {
    color: couleurs.encreTertiaire,
    fontSize: 11,
    fontWeight: "600",
    letterSpacing: 0.6,
    textTransform: "uppercase",
  },
  valeur: {
    color: couleurs.encre,
    fontSize: 40,
    lineHeight: 44,
    fontFamily: polices.condense,
    fontVariant: ["tabular-nums"],
  },
  valeurKo: { color: couleurs.dangerEncre },
  pas: { flexDirection: "row", gap: espace.s },
  fermer: { width: 40, height: 40, alignItems: "center", justifyContent: "center" },
  grille: { flexDirection: "row", flexWrap: "wrap", gap: espace.s },
  // Trois touches par rangée : (100 % − 2 écarts) / 3.
  touche: {
    width: "31.9%",
    minHeight: 52,
    borderRadius: rayon.bouton,
    backgroundColor: couleurs.surface3,
    alignItems: "center",
    justifyContent: "center",
  },
  toucheEtroite: { width: 64, minHeight: CIBLE },
  toucheAppuyee: { backgroundColor: couleurs.surface2 },
  toucheInactive: { opacity: 0.35 },
  toucheTexte: {
    color: couleurs.encre,
    fontSize: taille.grand + 2,
    fontWeight: "600",
    fontVariant: ["tabular-nums"],
  },
  actions: { flexDirection: "row", gap: espace.s },
  secondaire: {
    flex: 1,
    minHeight: CIBLE + 4,
    borderRadius: rayon.bouton,
    borderWidth: 1,
    borderColor: couleurs.ligneForte,
    alignItems: "center",
    justifyContent: "center",
  },
  secondaireTexte: { color: couleurs.encre, fontSize: taille.courant, fontWeight: "700" },
  valider: {
    flex: 1.4,
    minHeight: CIBLE + 4,
    borderRadius: rayon.bouton,
    backgroundColor: couleurs.action,
    alignItems: "center",
    justifyContent: "center",
  },
  validerInactif: { opacity: 0.4 },
  validerAppuye: { opacity: 0.85 },
  validerTexte: { color: couleurs.surAction, fontSize: taille.courant, fontWeight: "700" },
}));
