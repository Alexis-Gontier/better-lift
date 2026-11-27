// Garde-fou des couleurs (D349, D351) : lit les tokens dans les deux CSS, seuls sources des
// valeurs, et échoue si une paire texte / fond passe sous 4,5:1 (D251) ou si le web et le
// mobile ne portent plus les mêmes valeurs pour un même rôle. Lancé par `pnpm lint`.

import { readFileSync } from "node:fs";

const lire = (chemin) => readFileSync(new URL(`../${chemin}`, import.meta.url), "utf8");

// Les déclarations `--nom: #rrggbb` du premier bloc qui suit `debut`.
const bloc = (css, debut, prefixe) => {
  const i = css.indexOf(debut);
  if (i < 0) throw new Error(`bloc introuvable : ${debut}`);
  const corps = css.slice(i, css.indexOf("}", i));
  const re = new RegExp(`--${prefixe}([a-z-]+):\\s*(#[0-9a-fA-F]{6})\\b`, "g");
  return Object.fromEntries(
    [...corps.matchAll(re)].map(([, nom, hex]) => [nom, hex.toLowerCase()]),
  );
};

const mobile = lire("apps/mobile/global.css");
const web = lire("apps/web/src/styles/globals.css");
const SURFACES = {
  mobile: {
    clair: bloc(mobile, "@variant light", "color-"),
    sombre: bloc(mobile, "@variant dark", "color-"),
  },
  web: { clair: bloc(web, ":root {", ""), sombre: bloc(web, ".dark {", "") },
};

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

const echecs = [];
for (const [surface, themes] of Object.entries(SURFACES)) {
  for (const [theme, t] of Object.entries(themes)) {
    for (const [texte, fond] of PAIRES) {
      if (!t[texte] || !t[fond]) {
        echecs.push(`${surface} ${theme} : rôle absent (${t[texte] ? fond : texte})`);
        continue;
      }
      const c = contraste(t[texte], t[fond]);
      if (c < 4.5) echecs.push(`${surface} ${theme} : ${texte} / ${fond} à ${c.toFixed(2)}:1`);
    }
  }
}
for (const theme of ["clair", "sombre"]) {
  const m = SURFACES.mobile[theme];
  for (const [role, hex] of Object.entries(SURFACES.web[theme])) {
    if (m[role] && m[role] !== hex)
      echecs.push(`${theme} : ${role} vaut ${hex} sur le web, ${m[role]} sur le mobile`);
  }
}

if (echecs.length) {
  console.error(`Couleurs :\n- ${echecs.join("\n- ")}`);
  process.exitCode = 1;
} else {
  console.log("Couleurs : contrastes AA et valeurs web / mobile identiques.");
}
