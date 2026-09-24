import { Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { formaterDuree } from "../../lib/temps";
import { CIBLE, couleurs, espace, taille } from "../../lib/theme";

/**
 * Le repos restant, en grand, en bas de l'écran — là où le pouce et l'œil
 * tombent. Il FLOTTE (il se ferme), donc il a droit à l'élévation.
 */
export function BandeauRepos({
  restant,
  onPasser,
  onAjuster,
}: {
  restant: number;
  onPasser: () => void;
  /** −15 s / +15 s (D79). */
  onAjuster: (deltaSec: number) => void;
}) {
  const fini = restant === 0;
  // Au-dessus de la barre de gestes du système, jamais dessous.
  const { bottom } = useSafeAreaInsets();
  return (
    <View
      style={[styles.bandeau, { bottom: espace.m + bottom }, fini && styles.fini]}
      accessibilityLiveRegion="polite"
    >
      <View style={styles.haut}>
        <Text style={styles.libelle}>{fini ? "C'est reparti" : "Repos"}</Text>
        {/* Lisible à bout de bras, téléphone posé sur le banc (D79). */}
        <Text style={[styles.temps, fini && styles.tempsFini]}>{formaterDuree(restant)}</Text>
      </View>
      <View style={styles.boutons}>
        <Pressable
          onPress={() => onAjuster(-15)}
          style={styles.bouton}
          accessibilityRole="button"
          accessibilityLabel="Retirer 15 secondes"
        >
          <Text style={styles.boutonTexte}>−15 s</Text>
        </Pressable>
        <Pressable
          onPress={() => onAjuster(15)}
          style={styles.bouton}
          accessibilityRole="button"
          accessibilityLabel="Ajouter 15 secondes"
        >
          <Text style={styles.boutonTexte}>+15 s</Text>
        </Pressable>
        <Pressable onPress={onPasser} style={styles.bouton} accessibilityRole="button">
          <Text style={styles.boutonTexte}>{fini ? "OK" : "Passer"}</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bandeau: {
    position: "absolute",
    left: espace.m,
    right: espace.m,
    bottom: espace.m,
    padding: espace.l,
    gap: espace.m,
    borderRadius: 16,
    backgroundColor: couleurs.surface3,
    borderWidth: 1,
    borderColor: couleurs.ligneForte,
    elevation: 12,
  },
  fini: { borderColor: couleurs.accent },
  haut: { alignItems: "center" },
  libelle: { color: couleurs.encrePale, fontSize: taille.petit, textTransform: "uppercase" },
  temps: {
    color: couleurs.encre,
    fontSize: 56,
    fontWeight: "700",
    fontVariant: ["tabular-nums"],
  },
  tempsFini: { color: couleurs.accent },
  boutons: { flexDirection: "row", gap: espace.s },
  bouton: {
    flex: 1,
    minHeight: CIBLE,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: couleurs.ligneForte,
    alignItems: "center",
    justifyContent: "center",
  },
  boutonTexte: { color: couleurs.encre, fontSize: taille.courant, fontVariant: ["tabular-nums"] },
});
