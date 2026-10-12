import type { Couleurs } from "../type";

// Underground orange (D161) : graphite et orange.

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
