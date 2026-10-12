/**
 * Les rôles de couleur d'un thème (D101, D161, D182) : UN token par rôle, DEUX
 * valeurs (sombre, clair). TypeScript pur, sans React Native : `lib/themes.test.ts`
 * mesure chaque contraste, pour chaque thème. En salle, à bout de bras, il faut des cibles larges et
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

/**
 * Un thème (D182) : tout ce qui fait l'identité visible. Espacements, tailles
 * de texte et cible tactile restent communs (`lib/theme.ts`) : ce sont des
 * contraintes d'ergonomie en salle, pas du style.
 */
export type Theme = {
  nom: string;
  couleurs: { sombre: Couleurs; clair: Couleurs };
  polices: {
    /** Les fichiers à charger au démarrage, par nom de famille. */
    fichiers: Record<string, number>;
    regulier: string;
    moyen: string;
    demiGras: string;
    gras: string;
    /** Titres de page, noms en tête, chrono, valeurs de record. */
    affiche: string;
  };
  rayon: { cellule: number; bouton: number; bandeau: number; carte: number; feuille: number };
  /** Le style de l'affiche, à côté de sa police. */
  affiche: { textTransform: "uppercase" | "none"; letterSpacing: number };
};
