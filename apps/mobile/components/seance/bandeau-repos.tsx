import { Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { formaterDuree } from "../../lib/temps";
import { CIBLE, couleurs, espace, taille } from "../../lib/theme";

/**
 * Le repos restant, en grand, en bas de l'écran — là où le pouce et l'œil
 * tombent. Il FLOTTE (il se ferme), donc il a droit à l'élévation.
 */
export function BandeauRepos({ restant, onPasser }: { restant: number; onPasser: () => void }) {
  const fini = restant === 0;
  // Au-dessus de la barre de gestes du système, jamais dessous.
  const { bottom } = useSafeAreaInsets();
  return (
    <View
      style={[styles.bandeau, { bottom: espace.m + bottom }, fini && styles.fini]}
      accessibilityLiveRegion="polite"
    >
      <View style={{ flex: 1 }}>
        <Text style={styles.libelle}>{fini ? "C'est reparti" : "Repos"}</Text>
        <Text style={[styles.temps, fini && styles.tempsFini]}>{formaterDuree(restant)}</Text>
      </View>
      <Pressable onPress={onPasser} style={styles.passer} accessibilityRole="button">
        <Text style={styles.passerTexte}>{fini ? "OK" : "Passer"}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  bandeau: {
    position: "absolute",
    left: espace.m,
    right: espace.m,
    bottom: espace.m,
    flexDirection: "row",
    alignItems: "center",
    padding: espace.l,
    borderRadius: 14,
    backgroundColor: couleurs.surface3,
    borderWidth: 1,
    borderColor: couleurs.ligneForte,
    elevation: 12,
  },
  fini: { borderColor: couleurs.accent },
  libelle: { color: couleurs.encrePale, fontSize: taille.petit, textTransform: "uppercase" },
  temps: {
    color: couleurs.encre,
    fontSize: taille.chrono,
    fontWeight: "700",
    fontVariant: ["tabular-nums"],
  },
  tempsFini: { color: couleurs.accent },
  passer: {
    minHeight: CIBLE,
    minWidth: 88,
    paddingHorizontal: espace.l,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: couleurs.ligneForte,
    alignItems: "center",
    justifyContent: "center",
  },
  passerTexte: { color: couleurs.encre, fontSize: taille.courant },
});
