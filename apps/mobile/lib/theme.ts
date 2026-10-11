import { StyleSheet, type TextStyle, useColorScheme } from "react-native";

import { type Couleurs, clair, sombre } from "./palette";

/** Les couleurs du thème courant, qui suit celui du téléphone (D102). */
export function useCouleurs(): Couleurs {
  return useColorScheme() === "light" ? clair : sombre;
}

/**
 * Les polices (D103). Archivo, chargée par `expo-font` dans `app/_layout.tsx` ;
 * la coupe condensée est générée par `scripts/polices/condenser-archivo.py`.
 * Une police chargée ne se met pas en gras toute seule sous Android : chaque
 * graisse est une famille à part.
 */
export const polices = {
  moyen: "Archivo_500Medium",
  demiGras: "Archivo_600SemiBold",
  gras: "Archivo_700Bold",
  extraGras: "Archivo_800ExtraBold",
  /** Chiffres héros : chrono, bilans. */
  condense: "ArchivoCondense-Bold",
} as const;

function famillePour(graisse: TextStyle["fontWeight"]): string {
  switch (String(graisse ?? "500")) {
    case "600":
      return polices.demiGras;
    case "700":
    case "bold":
      return polices.gras;
    case "800":
    case "900":
      return polices.extraGras;
    default:
      return polices.moyen;
  }
}

/**
 * Pose la famille Archivo de la bonne graisse sur chaque style de texte, et
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
  titre: 26,
  chrono: 48,
} as const;

/** Espacements en base 4 (D104). */
export const espace = { xs: 4, s: 8, m: 12, l: 16, xl: 24, xxl: 32 } as const;

/** Les rayons par rôle (D104). */
export const rayon = { cellule: 10, bouton: 14, bandeau: 18, carte: 20, feuille: 24 } as const;
