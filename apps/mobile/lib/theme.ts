import { StyleSheet, useColorScheme } from "react-native";

import { type Couleurs, clair, sombre } from "./palette";

/** Les couleurs du thème courant, qui suit celui du téléphone (D102). */
export function useCouleurs(): Couleurs {
  return useColorScheme() === "light" ? clair : sombre;
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
      styles = StyleSheet.create(fabrique(c));
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

/** Les rayons par rôle (D164) : francs, comme On Air, sans être tranchants. */
export const rayon = { cellule: 6, bouton: 6, bandeau: 6, carte: 6, feuille: 16 } as const;

/**
 * PROVISOIRE (D316) : l'ancienne « affiche », sans Barlow ni capitales, pour les
 * écrans pas encore réécrits. Partira au lot 3.
 */
export const affiche = { fontWeight: "700" } as const;
