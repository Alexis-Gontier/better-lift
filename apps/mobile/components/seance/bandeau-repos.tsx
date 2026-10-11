import { Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { formaterDuree } from "../../lib/temps";
import { CIBLE, creerStyles, espace, PLAFOND_TEXTE_DENSE, polices, rayon } from "../../lib/theme";
import { Appuyable } from "../ui/appuyable";

/**
 * Le repos restant, sur une ligne en bas de l'écran — là où le pouce et l'œil
 * tombent. Il FLOTTE (il se ferme), donc il a droit à l'élévation.
 */
export function BandeauRepos({
  restant,
  onPasser,
  onAjuster,
  onAgrandir,
}: {
  restant: number;
  onPasser: () => void;
  /** −15 s / +15 s (D79). */
  onAjuster: (deltaSec: number) => void;
  /** Rouvre l'horloge de salle (D168) ; absent quand le repos est fini. */
  onAgrandir?: () => void;
}) {
  const styles = useStyles();
  const fini = restant === 0;
  // Au-dessus de la barre de gestes du système, jamais dessous.
  const { bottom } = useSafeAreaInsets();
  return (
    <View style={[styles.bandeau, { bottom: espace.m + bottom }, fini && styles.fini]}>
      <Appuyable
        onPress={() => onAjuster(-15)}
        style={styles.bouton}
        accessibilityRole="button"
        accessibilityLabel="Retirer 15 secondes"
      >
        <Text maxFontSizeMultiplier={PLAFOND_TEXTE_DENSE} style={styles.boutonTexte}>
          −15
        </Text>
      </Appuyable>
      {/* Lisible à bout de bras, téléphone posé sur le banc (D79). */}
      <Appuyable
        style={styles.centre}
        onPress={onAgrandir}
        disabled={!onAgrandir}
        accessibilityRole="button"
        accessibilityLabel="Agrandir le repos"
      >
        {/* Seul le libellé est annoncé, une fois, quand le repos se termine : sur
            tout le bandeau, le lecteur d'écran lisait le décompte à chaque seconde. */}
        <Text
          maxFontSizeMultiplier={PLAFOND_TEXTE_DENSE}
          style={styles.libelle}
          accessibilityLiveRegion="polite"
        >
          {fini ? "Repos terminé" : "Repos"}
        </Text>
        <Text
          maxFontSizeMultiplier={PLAFOND_TEXTE_DENSE}
          style={[styles.temps, fini && styles.tempsFini]}
        >
          {formaterDuree(restant)}
        </Text>
      </Appuyable>
      <Appuyable
        onPress={() => onAjuster(15)}
        style={styles.bouton}
        accessibilityRole="button"
        accessibilityLabel="Ajouter 15 secondes"
      >
        <Text maxFontSizeMultiplier={PLAFOND_TEXTE_DENSE} style={styles.boutonTexte}>
          +15
        </Text>
      </Appuyable>
      <Appuyable
        onPress={onPasser}
        style={[styles.bouton, styles.passer]}
        accessibilityRole="button"
      >
        <Text maxFontSizeMultiplier={PLAFOND_TEXTE_DENSE} style={styles.boutonTexte}>
          {fini ? "OK" : "Passer"}
        </Text>
      </Appuyable>
    </View>
  );
}

const useStyles = creerStyles((couleurs) => ({
  // Une seule ligne (D88), façon Hevy : le repos ne doit plus masquer la séance.
  bandeau: {
    position: "absolute",
    left: espace.m,
    right: espace.m,
    flexDirection: "row",
    alignItems: "center",
    gap: espace.s,
    padding: espace.s,
    borderRadius: rayon.bandeau,
    backgroundColor: couleurs.surface3,
    borderWidth: 1,
    borderColor: couleurs.ligneForte,
    elevation: 12,
  },
  fini: { borderColor: couleurs.encre },
  centre: { flex: 1, alignItems: "center" },
  libelle: { color: couleurs.encreTertiaire, fontSize: 11, textTransform: "uppercase" },
  temps: {
    color: couleurs.encre,
    fontSize: 34,
    lineHeight: 36,
    fontFamily: polices.affiche,
    fontVariant: ["tabular-nums"],
  },
  tempsFini: { color: couleurs.encre },
  bouton: {
    width: 52,
    height: CIBLE,
    borderRadius: rayon.cellule,
    backgroundColor: couleurs.surface2,
    alignItems: "center",
    justifyContent: "center",
  },
  passer: { width: 72 },
  boutonTexte: {
    color: couleurs.encre,
    fontSize: 15,
    fontWeight: "600",
    fontVariant: ["tabular-nums"],
  },
}));
