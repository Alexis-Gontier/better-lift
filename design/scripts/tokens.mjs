// Tokens de la direction A (« Instrument sobre »), clair et sombre, aux noms des rôles du code.
// Écrit les fichiers DTCG de design/tokens/ et vérifie les contrastes. Avec un identifiant de
// page OpenPencil en argument, les importe aussi dans l'app ouverte.

import { execFileSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";

export const TOKENS = {
  clair: {
    background: "#F4F4F2",
    foreground: "#0B0B0C",
    card: "#FFFFFF",
    "card-foreground": "#0B0B0C",
    popover: "#FFFFFF",
    "popover-foreground": "#0B0B0C",
    primary: "#2440F0",
    "primary-foreground": "#FFFFFF",
    secondary: "#ECECE9",
    "secondary-foreground": "#0B0B0C",
    muted: "#ECECE9",
    "muted-foreground": "#636366",
    accent: "#ECECE9",
    "accent-foreground": "#0B0B0C",
    destructive: "#C8281E",
    border: "#E2E2DF",
    input: "#E2E2DF",
    ring: "#2440F0",
    record: "#2440F0",
    "record-surface": "#E8ECFE",
  },
  sombre: {
    background: "#0E0E10",
    foreground: "#F2F2F0",
    card: "#17171A",
    "card-foreground": "#F2F2F0",
    popover: "#17171A",
    "popover-foreground": "#F2F2F0",
    primary: "#7088FF",
    "primary-foreground": "#0B0B0C",
    secondary: "#1F1F23",
    "secondary-foreground": "#F2F2F0",
    muted: "#1F1F23",
    "muted-foreground": "#9A9AA0",
    accent: "#1F1F23",
    "accent-foreground": "#F2F2F0",
    destructive: "#F2554A",
    border: "#2A2A2F",
    input: "#2A2A2F",
    ring: "#7088FF",
    record: "#7088FF",
    "record-surface": "#1C2147",
  },
};

// Paires texte / fond à tenir à 4,5:1 (D251), dans chaque thème.
const PAIRES = [
  ["foreground", "background"],
  ["foreground", "card"],
  ["muted-foreground", "background"],
  ["muted-foreground", "card"],
  ["muted-foreground", "muted"],
  ["primary-foreground", "primary"],
  ["primary", "card"],
  ["primary", "background"],
  ["record", "record-surface"],
  ["destructive", "card"],
];

const lum = (hex) => {
  const [r, g, b] = [1, 3, 5].map((i) => {
    const c = Number.parseInt(hex.slice(i, i + 2), 16) / 255;
    return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const contraste = (a, b) => {
  const [x, y] = [lum(a), lum(b)].sort((m, n) => n - m);
  return (x + 0.05) / (y + 0.05);
};

let echecs = 0;
for (const [mode, t] of Object.entries(TOKENS)) {
  for (const [texte, fond] of PAIRES) {
    const c = contraste(t[texte], t[fond]);
    if (c < 4.5) echecs++;
    console.log(`${c < 4.5 ? "ÉCHEC" : "ok   "} ${mode} ${texte} / ${fond} : ${c.toFixed(2)}`);
  }
}

const dtcg = (t) =>
  JSON.stringify(
    Object.fromEntries(
      Object.entries(t).map(([nom, valeur]) => [nom, { $type: "color", $value: valeur }]),
    ),
    null,
    2,
  );
const racine = new URL("../tokens/better-lift/", import.meta.url);
mkdirSync(racine, { recursive: true });
for (const [mode, t] of Object.entries(TOKENS))
  writeFileSync(new URL(`${mode}.tokens.json`, racine), `${dtcg(t)}\n`);

const [page, tmp] = process.argv.slice(2);
if (page) {
  const args = {
    files: Object.entries(TOKENS).map(([mode, t]) => ({
      path: `better-lift/${mode}.tokens.json`,
      text: dtcg(t),
    })),
  };
  writeFileSync(`${tmp}/args.json`, JSON.stringify(args));
  console.log(
    execFileSync(
      "openpencil.cmd",
      [
        "tool",
        "call",
        "import_design_tokens",
        "--args-file",
        `${tmp}/args.json`,
        "--page-id",
        page,
        "--json",
      ],
      {
        shell: true,
      },
    )
      .toString()
      .slice(0, 800),
  );
}
process.exitCode = echecs ? 1 : 0;
