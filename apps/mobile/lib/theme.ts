import { StyleSheet, type TextStyle, useColorScheme } from "react-native";

/**
 * Le système de couleurs du mobile (D101) : UN token par rôle, DEUX valeurs
 * (sombre, clair). Le mobile partage la palette du web, pas son échelle : en
 * salle, à bout de bras, il faut des cibles larges et un contraste franc.
 *
 * Le lime ne porte que deux rôles, distingués par la forme : l'action en aplat
 * (`action` / `surAction`), le record en contour (`record*`). Seule exception :
 * la carte du corps (`corps*`, D84). Le danger a sa propre couleur.
 */
export type Couleurs = {
  /** Fond d'écran. */
  canevas: string;
  /** Cartes, ligne de série faite. */
  surface1: string;
  /** Cellules de saisie, puces, feuilles basses. */
  surface2: string;
  /** Bandeaux, boutons secondaires, touches du pavé. */
  surface3: string;
  /** Filets entre lignes et blocs. */
  ligne: string;
  /** Contours de boutons, ✓ à venir, filet d'attente. */
  ligneForte: string;
  /** Titres, valeurs saisies, onglet actif. */
  encre: string;
  /** Texte d'appui, icônes. */
  encreSecondaire: string;
  /** Méta, « Précédent », valeurs fantômes. */
  encreTertiaire: string;
  /** En-têtes de colonnes, désactivé. */
  encreAttenuee: string;
  /** L'aplat de la seule action principale de l'écran. */
  action: string;
  /** Texte et icône posés sur l'aplat. */
  surAction: string;
  /** Texte et flèche du badge record. */
  recordEncre: string;
  /** Fond teinté du badge record. */
  recordFond: string;
  /** Contour du badge record. */
  recordLigne: string;
  /** Aplat d'une confirmation destructive. */
  danger: string;
  /** Texte posé sur l'aplat de danger. */
  surDanger: string;
  /** Abandonner, Retirer, Supprimer, erreurs de champ. */
  dangerEncre: string;
  /** Voile sous les feuilles basses. */
  voile: string;
  /** Muscles principaux sur la carte du corps (D84). */
  corps: string;
  /** Muscles secondaires sur la carte du corps. */
  corpsSecondaire: string;
};

const LIME = "#a8cf45";

const sombre: Couleurs = {
  canevas: "#08090a",
  surface1: "#101214",
  surface2: "#181b1e",
  surface3: "#1e2226",
  ligne: "#24272b",
  ligneForte: "#32363b",
  encre: "#f2f3f5",
  encreSecondaire: "#b6bcc4",
  encreTertiaire: "#868d96",
  // 4,9:1 sur le canevas (l'ancien #6a717a ne tenait que 4,0:1).
  encreAttenuee: "#7a818a",
  action: LIME,
  surAction: "#0b0f04",
  recordEncre: LIME,
  recordFond: "rgba(168, 207, 69, 0.14)",
  recordLigne: "rgba(168, 207, 69, 0.35)",
  danger: "#a83e39",
  surDanger: "#fdf3f2",
  dangerEncre: "#e98b85",
  voile: "rgba(0, 0, 0, 0.6)",
  corps: LIME,
  corpsSecondaire: "rgba(168, 207, 69, 0.45)",
};

const clair: Couleurs = {
  canevas: "#f5f6f7",
  surface1: "#ffffff",
  surface2: "#eef0f2",
  surface3: "#e4e7ea",
  ligne: "#e1e4e8",
  ligneForte: "#c9ced4",
  encre: "#0e1114",
  encreSecondaire: "#3e454d",
  encreTertiaire: "#5f666f",
  encreAttenuee: "#7c838c",
  action: LIME,
  surAction: "#0b0f04",
  // Le lime en texte ne se lit pas sur fond clair : le record passe à l'olive.
  recordEncre: "#4d6a12",
  recordFond: "rgba(168, 207, 69, 0.22)",
  recordLigne: "rgba(77, 106, 18, 0.35)",
  danger: "#a83e39",
  surDanger: "#fdf3f2",
  dangerEncre: "#a83e39",
  voile: "rgba(0, 0, 0, 0.4)",
  corps: LIME,
  corpsSecondaire: "rgba(168, 207, 69, 0.45)",
};

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

export const taille = { petit: 13, courant: 16, grand: 20, titre: 26, chrono: 34 } as const;

export const espace = { xs: 4, s: 8, m: 12, l: 16, xl: 24 } as const;
