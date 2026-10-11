import type { LucideIcon } from "lucide-react-native";
import { Check } from "lucide-react-native";
import { Text, View } from "react-native";
import { creerStyles, espace, rayon, taille, useCouleurs } from "../../lib/theme";
import { Appuyable } from "./appuyable";
import { FeuilleBasse } from "./feuille-basse";

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
  return (
    <FeuilleBasse visible={visible} onFermer={onFermer}>
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
    </FeuilleBasse>
  );
}

const useStyles = creerStyles((couleurs) => ({
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
    borderRadius: rayon.cellule,
  },
  appuyee: { backgroundColor: couleurs.surface3 },
  libelle: { flex: 1, fontSize: taille.courant },
  indication: { color: couleurs.encreAttenuee, fontSize: taille.petit },
}));
