/**
 * PROVISOIRE (D316) : l'ancien système de couleurs, gardé pour la séance, la fin
 * et le Profil jusqu'à leur réécriture (lots 2 et 3), puis supprimé. Ses valeurs
 * sont la palette `neutral` de `global.css` : le code neuf passe par les classes
 * Uniwind, jamais par ce fichier. UN token par rôle, DEUX valeurs (sombre,
 * clair) ; `palette.test.ts` mesure chaque contraste.
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
   * vérifie d'un coup d'œil entre deux séries.
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
   * ni le danger.
   */
  superset: string;
  /**
   * Fond des vignettes et GIF d'exercice. Blanc dans LES DEUX registres : les
   * images du catalogue sont détourées sur blanc, un fond sombre les encadrerait.
   */
  fondImage: string;
};

export const sombre: Couleurs = {
  canevas: "#0a0a0a",
  surface1: "#171717",
  surface2: "#262626",
  surface3: "#262626",
  ligne: "#262626",
  ligneFaite: "#262626",
  ligneForte: "#525252",
  encre: "#fafafa",
  encreSecondaire: "#d4d4d4",
  encreTertiaire: "#a3a3a3",
  encreAttenuee: "#a3a3a3",
  action: "#fafafa",
  surAction: "#171717",
  recordEncre: "#fafafa",
  recordFond: "#262626",
  recordLigne: "#a3a3a3",
  danger: "#dc2626",
  surDanger: "#ffffff",
  dangerEncre: "#f87171",
  voile: "rgba(0, 0, 0, 0.6)",
  superset: "#a3a3a3",
  fondImage: "#ffffff",
};

export const clair: Couleurs = {
  canevas: "#ffffff",
  surface1: "#fafafa",
  surface2: "#f5f5f5",
  surface3: "#e5e5e5",
  ligne: "#e5e5e5",
  ligneFaite: "#ededed",
  ligneForte: "#a3a3a3",
  encre: "#0a0a0a",
  encreSecondaire: "#404040",
  encreTertiaire: "#525252",
  encreAttenuee: "#595959",
  action: "#171717",
  surAction: "#fafafa",
  recordEncre: "#0a0a0a",
  recordFond: "#f5f5f5",
  recordLigne: "#525252",
  danger: "#dc2626",
  surDanger: "#ffffff",
  dangerEncre: "#b91c1c",
  voile: "rgba(0, 0, 0, 0.4)",
  superset: "#525252",
  fondImage: "#ffffff",
};
