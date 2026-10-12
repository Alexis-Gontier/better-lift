/**
 * Le système de couleurs du mobile (D101, D161) : UN token par rôle, DEUX
 * valeurs (sombre, clair). TypeScript pur, sans React Native : `palette.test.ts`
 * mesure chaque contraste. En salle, à bout de bras, il faut des cibles larges et
 * un contraste franc.
 *
 * L'orange ne porte que deux rôles, distingués par la forme : l'action en aplat
 * (`action` / `surAction`), le record en contour (`record*`). Exceptions bornées
 * (D162) : la carte du corps (`corps*`), le calendrier, l'horloge de salle, et
 * l'onglet actif avec son halo d'appui (D181). Le danger a sa propre
 * couleur.
 */
export type Couleurs = {
  /** Fond d'écran. */
  canevas: string;
  /** Cartes. */
  surface1: string;
  /** Cellules de saisie, puces, feuilles basses. */
  surface2: string;
  /** Bandeaux, boutons secondaires, touches du pavé. */
  surface3: string;
  /** Filets entre lignes et blocs. */
  ligne: string;
  /**
   * Le fond d'une série faite : NETTEMENT distinct du canevas — c'est ce qu'on
   * vérifie d'un coup d'œil entre deux séries. Neutre : l'orange reste à l'action.
   */
  ligneFaite: string;
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
  /**
   * Icône et libellé de l'onglet actif (D181) : l'orange de l'app, en texte. En
   * clair, l'orange vif ne se lit pas (2,8:1) : un orange brûlé qui tient 4,5:1.
   */
  ongletActif: string;
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
  /**
   * Le repère d'un superset (D151) : filet et étiquette. Ni l'action ni le record
   * (orange), ni le danger. 5,3:1 et plus sur les surfaces, dans les deux registres.
   */
  superset: string;
  /** Muscles principaux sur la carte du corps (D84). */
  corps: string;
  /** Muscles secondaires sur la carte du corps. */
  corpsSecondaire: string;
  /**
   * Le calendrier des Stats (D126, D127) : jour sans séance (0), puis quatre
   * niveaux d'effort. Deuxième exception à l'orange après la carte du corps, de
   * même nature : une intensité d'entraînement, jamais une action ni un record.
   */
  calendrier: readonly [string, string, string, string, string];
  /**
   * Fond des vignettes et GIF d'exercice. Blanc dans LES DEUX registres : les
   * images du catalogue sont détourées sur blanc, un fond sombre les encadrerait.
   */
  fondImage: string;
};

const ORANGE = "#f47a20";
/** L'orange franc de Basic-Fit, pour le registre clair (D161). */
const ORANGE_CLAIR = "#fe7000";

export const sombre: Couleurs = {
  canevas: "#121412",
  surface1: "#1b1e1b",
  surface2: "#242824",
  surface3: "#2c312c",
  ligne: "#2b302b",
  ligneFaite: "#262b26",
  ligneForte: "#3d433d",
  encre: "#f3f4f1",
  encreSecondaire: "#c3c8c3",
  encreTertiaire: "#9aa09b",
  // 5,2:1 sur les feuilles (surface2), 6,4:1 sur le canevas.
  encreAttenuee: "#939a93",
  action: ORANGE,
  surAction: "#121412",
  ongletActif: ORANGE,
  recordEncre: ORANGE,
  recordFond: "rgba(244, 122, 32, 0.14)",
  recordLigne: "rgba(244, 122, 32, 0.4)",
  danger: "#c42443",
  surDanger: "#ffffff",
  // Rouge rosé : l'ancien rouge se confondait avec l'orange de l'action.
  dangerEncre: "#ff4d6d",
  voile: "rgba(0, 0, 0, 0.6)",
  superset: "#9a8cf0",
  corps: ORANGE,
  corpsSecondaire: "rgba(244, 122, 32, 0.45)",
  calendrier: [
    "#242824",
    "rgba(244, 122, 32, 0.25)",
    "rgba(244, 122, 32, 0.5)",
    "rgba(244, 122, 32, 0.75)",
    ORANGE,
  ],
  fondImage: "#ffffff",
};

export const clair: Couleurs = {
  canevas: "#f4f4f2",
  surface1: "#ffffff",
  surface2: "#ebebe7",
  surface3: "#e1e1dc",
  ligne: "#dcdcd7",
  ligneFaite: "#e6e6e1",
  ligneForte: "#b9bdb6",
  encre: "#121412",
  encreSecondaire: "#3b403c",
  encreTertiaire: "#5c625d",
  // 4,8:1 sur les feuilles (surface2), 5,2:1 sur le canevas.
  encreAttenuee: "#626862",
  action: ORANGE_CLAIR,
  surAction: "#121412",
  ongletActif: "#b04c00",
  // L'orange en texte ne se lit pas sur fond clair : le record passe à l'orange brûlé.
  recordEncre: "#a84800",
  recordFond: "rgba(254, 112, 0, 0.1)",
  recordLigne: "rgba(168, 72, 0, 0.4)",
  danger: "#c4213f",
  surDanger: "#ffffff",
  dangerEncre: "#c4213f",
  voile: "rgba(0, 0, 0, 0.4)",
  superset: "#5a4bbf",
  corps: ORANGE_CLAIR,
  corpsSecondaire: "rgba(254, 112, 0, 0.4)",
  calendrier: [
    "#e1e1dc",
    "rgba(254, 112, 0, 0.22)",
    "rgba(254, 112, 0, 0.45)",
    "rgba(254, 112, 0, 0.7)",
    "#e06300",
  ],
  fondImage: "#ffffff",
};
