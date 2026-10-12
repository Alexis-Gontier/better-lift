import { StyleSheet, type TextStyle, useColorScheme } from "react-native";

import type { Couleurs } from "../themes/type";
import { themeActif } from "./theme-actif";

export type { Couleurs };

/**
 * Les couleurs du thème actif (D182), dans le registre qui suit celui du
 * téléphone (D102).
 */
export function useCouleurs(): Couleurs {
  return useColorScheme() === "light" ? themeActif.couleurs.clair : themeActif.couleurs.sombre;
}

/**
 * Les polices du thème actif (D163, D182) : une famille pour l'interface, une
 * affiche pour les titres de page, les noms en tête, le chrono et les valeurs de
 * record — jamais dans un bouton, une étiquette ni un tableau. Chargées par
 * `expo-font` dans `app/_layout.tsx`. Une police chargée ne se met pas en gras
 * toute seule sous Android : chaque graisse est une famille à part.
 */
export const polices = {
  regulier: themeActif.polices.regulier,
  moyen: themeActif.polices.moyen,
  demiGras: themeActif.polices.demiGras,
  gras: themeActif.polices.gras,
  affiche: themeActif.polices.affiche,
} as const;

function famillePour(graisse: TextStyle["fontWeight"]): string {
  switch (String(graisse ?? "500")) {
    case "400":
    case "normal":
      return polices.regulier;
    case "600":
      return polices.demiGras;
    case "700":
    case "bold":
    case "800":
    case "900":
      return polices.gras;
    default:
      return polices.moyen;
  }
}

/**
 * Pose la famille de la bonne graisse sur chaque style de texte, et
 * retire `fontWeight`, qu'Android appliquerait par-dessus en faux gras.
 */
function avecPolices<T extends object>(styles: T): T {
  const sortie: Record<string, unknown> = {};
  for (const [nom, style] of Object.entries(styles)) {
    const s = style as TextStyle;
    if (s && typeof s === "object" && ("fontSize" in s || "fontWeight" in s)) {
      const { fontWeight, ...reste } = s;
      sortie[nom] = { fontFamily: s.fontFamily ?? famillePour(fontWeight), ...reste };
    } else {
      sortie[nom] = style;
    }
  }
  return sortie as T;
}

/**
 * Les styles d'un composant, construits depuis le thème courant (D102). Un
 * `StyleSheet.create` au niveau du module figerait les couleurs au chargement :
 * le passage au thème clair ne changerait rien. Les deux jeux sont calculés une
 * fois chacun, au premier usage.
 *
 *     const useStyles = creerStyles((c) => ({ titre: { color: c.encre } }));
 *     // dans le composant :
 *     const styles = useStyles();
 */
export function creerStyles<T extends StyleSheet.NamedStyles<T>>(
  fabrique: (c: Couleurs) => T,
): () => T {
  const parTheme = new Map<Couleurs, T>();
  return function useStyles(): T {
    const c = useCouleurs();
    let styles = parTheme.get(c);
    if (!styles) {
      styles = StyleSheet.create(avecPolices(fabrique(c)));
      parTheme.set(c, styles);
    }
    return styles;
  };
}

/** La plus petite cible tactile : 48 px, recommandation Android. */
export const CIBLE = 48;

/**
 * Le grossissement maximal du texte DANS LES ÉLÉMENTS DE HAUTEUR FIXE de la
 * séance (cases de 40, ligne de 52, pavé, bandeau de repos). Au-delà, les
 * chiffres seraient rognés. Partout ailleurs, le texte suit le réglage du
 * téléphone sans plafond.
 */
export const PLAFOND_TEXTE_DENSE = 1.3;

/**
 * L'échelle (D104). `chrono` : la durée de séance, en coupe condensée ;
 * `valeur` : les cases kg / reps.
 */
export const taille = {
  petit: 13,
  courant: 16,
  valeur: 18,
  grand: 20,
  /** Titre de page, en affiche : le condensé se lit plus petit à taille égale. */
  titre: 32,
  chrono: 48,
} as const;

/** Espacements en base 4 (D104). */
export const espace = { xs: 4, s: 8, m: 12, l: 16, xl: 24, xxl: 32 } as const;

/** Les rayons par rôle (D164), fixés par le thème actif (D182). */
export const rayon = themeActif.rayon;

/**
 * L'affiche (D163) : la police d'affiche du thème, pour les titres de page, le
 * nom en tête d'une routine ou d'un exercice, le chrono, les valeurs de record.
 * `fontFamily` posée ici, `creerStyles` la respecte. À étaler dans un style :
 * `{ ...affiche, color, fontSize }`.
 */
export const affiche = { fontFamily: polices.affiche, ...themeActif.affiche };
