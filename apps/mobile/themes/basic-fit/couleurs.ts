import type { Couleurs } from "../type";

// Basic-Fit (D183), façon app mobile : orange sur fond sombre. Teintes relevées
// dans les variables CSS de basic-fit.com (octobre 2026) : orange `#eb6800`,
// sable `#fbf7f0` / `#f2e8d6` / `#e8d6bf`, texte `#2d2d2d`, danger `#c73326`.
// Pas de violet : une seule couleur d'action. Le blanc sur l'orange ne tient
// pas 4,5:1 : l'aplat porte un texte foncé.
const ORANGE = "#eb6800";

export const sombre: Couleurs = {
  canevas: "#0f0f0f",
  surface1: "#1a1a1a",
  surface2: "#242424",
  surface3: "#2e2e2e",
  ligne: "#2a2a2a",
  ligneFaite: "#262626",
  ligneForte: "#404040",
  encre: "#ffffff",
  encreSecondaire: "#c8c8c8",
  encreTertiaire: "#a3a3a3",
  encreAttenuee: "#969696",
  action: ORANGE,
  surAction: "#0f0f0f",
  ongletActif: ORANGE,
  recordEncre: ORANGE,
  recordFond: "rgba(235, 104, 0, 0.14)",
  recordLigne: "rgba(235, 104, 0, 0.4)",
  danger: "#c73326",
  surDanger: "#ffffff",
  // Le rouge de Basic-Fit, éclairci pour se lire sur le noir.
  dangerEncre: "#ff6b5c",
  voile: "rgba(0, 0, 0, 0.7)",
  superset: "#9a8cf0",
  corps: ORANGE,
  corpsSecondaire: "rgba(235, 104, 0, 0.45)",
  calendrier: [
    "#242424",
    "rgba(235, 104, 0, 0.25)",
    "rgba(235, 104, 0, 0.5)",
    "rgba(235, 104, 0, 0.75)",
    ORANGE,
  ],
  fondImage: "#ffffff",
};

export const clair: Couleurs = {
  canevas: "#fbf7f0",
  surface1: "#ffffff",
  surface2: "#f2e8d6",
  surface3: "#e8d6bf",
  ligne: "#e8dccb",
  ligneFaite: "#efe2cc",
  ligneForte: "#c9b9a3",
  encre: "#2d2d2d",
  encreSecondaire: "#454545",
  encreTertiaire: "#5c5c5c",
  encreAttenuee: "#656565",
  action: ORANGE,
  surAction: "#1a1a1a",
  // L'orange en texte ne se lit pas sur le sable : un orange brûlé.
  ongletActif: "#a84800",
  recordEncre: "#a84800",
  recordFond: "rgba(235, 104, 0, 0.1)",
  recordLigne: "rgba(168, 72, 0, 0.4)",
  danger: "#c73326",
  surDanger: "#ffffff",
  dangerEncre: "#b02a1e",
  voile: "rgba(0, 0, 0, 0.4)",
  superset: "#5a4bbf",
  corps: ORANGE,
  corpsSecondaire: "rgba(235, 104, 0, 0.4)",
  calendrier: [
    "#e8d6bf",
    "rgba(235, 104, 0, 0.22)",
    "rgba(235, 104, 0, 0.45)",
    "rgba(235, 104, 0, 0.7)",
    "#d45e00",
  ],
  fondImage: "#ffffff",
};
