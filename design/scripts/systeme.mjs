// Page « 2 · Système » : palette (clair / sombre), échelle de texte et composants de la
// direction A, liés aux variables importées par tokens.mjs.
// node design/scripts/systeme.mjs <id de page> <dossier temporaire>

import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";

const lire = (mode) =>
  Object.fromEntries(
    Object.entries(
      JSON.parse(
        readFileSync(new URL(`../tokens/better-lift/${mode}.tokens.json`, import.meta.url), "utf8"),
      ),
    ).map(([nom, { $value }]) => [nom, $value]),
  );
const TOKENS = { clair: lire("clair"), sombre: lire("sombre") };

const [page, tmp] = process.argv.slice(2);
const v = (nom) => `{designVar('${nom}')}`;
const fine = " ";
const UI = "Geist";
const DATA = "Geist Mono";

const t = (s, o = {}) =>
  `<Text size={${o.size ?? 14}} weight={${o.weight ?? 400}} font="${o.font ?? UI}" fill=${o.color ? v(o.color) : v("foreground")}${o.ls != null ? ` letterSpacing={${o.ls}}` : ""}>${s}</Text>`;
const titre = (s) => t(s, { size: 21, weight: 600, ls: -0.4 });
const legende = (s) => t(s, { size: 12, color: "muted-foreground" });
const icone = (nom, size, couleur) =>
  `<Icon name="lucide:${nom}" size={${size}} color=${v(couleur)} />`;
const section = (nom, inner) =>
  `<Frame name="${nom}" flex="col" items="start" gap={20} p={32} w={1360} bg=${v("card")} rounded={12} stroke=${v("border")} strokeWidth={1}>${titre(nom)}${inner}</Frame>`;
const ligne = (inner, gap = 24) => `<Frame flex="row" items="center" gap={${gap}}>${inner}</Frame>`;
const pile = (inner, gap = 8) => `<Frame flex="col" items="start" gap={${gap}}>${inner}</Frame>`;

// ——— palette ———
const nuancier = Object.keys(TOKENS.clair)
  .map(
    (nom) => `<Frame flex="col" items="start" gap={6} w={150}>
      <Frame flex="row" w={150} h={56} rounded={10} stroke=${v("border")} strokeWidth={1} overflow="hidden">
        <Frame w={75} h={56} bg=${v(nom)} /><Frame w={75} h={56} bg="${TOKENS.sombre[nom]}" /></Frame>
      ${t(nom, { size: 12, weight: 600 })}${t(`${TOKENS.clair[nom]} · ${TOKENS.sombre[nom]}`, { size: 11, color: "muted-foreground", font: DATA })}</Frame>`,
  )
  .join("");
const palette = section(
  "Palette",
  `${legende("À gauche le clair (lié à la variable), à droite le sombre. Noms = rôles de global.css et globals.css ; record et record-surface sont neufs.")}
  <Frame flex="row" wrap rowGap={20} gap={18} w={1296}>${nuancier}</Frame>`,
);

// ——— texte ———
const echelle = [
  ["Record héros", "100", { size: 72, weight: 600, ls: -2 }],
  ["Titre de page (web)", "Accueil", { size: 32, weight: 600, ls: -0.8 }],
  ["Chrono de repos", "1:34", { size: 28, weight: 600, ls: -0.5 }],
  ["Titre d'écran (mobile)", "Push A", { size: 21, weight: 600, ls: -0.4 }],
  ["Chiffre de synthèse", `2${fine}340 kg`, { size: 19, weight: 600, ls: -0.3 }],
  ["Série (Geist Mono)", "82,5", { size: 17, weight: 600, font: DATA }],
  ["Nom d'exercice", "Développé couché à la barre", { size: 16, weight: 600 }],
  ["Texte courant", "Charge, 1RM estimé et volume battus", { size: 14 }],
  ["Étiquette", "Volume max", { size: 11, weight: 500, color: "muted-foreground" }],
];
const texte = section(
  "Texte",
  `${legende("Geist pour tout ; Geist Mono pour les chiffres d'une série (charge, reps, précédent), qui doivent s'aligner en colonne.")}
  ${pile(echelle.map(([nom, ex, o]) => ligne(`<Frame w={220}>${legende(nom)}</Frame>${t(ex, o)}`)).join(""), 14)}`,
);

// ——— composants ———
const bouton = (s, genre) => {
  if (genre === "plein")
    return `<Frame flex="row" items="center" justify="center" px={16} h={40} rounded={10} bg=${v("primary")}>${t(s, { weight: 700, color: "primary-foreground" })}</Frame>`;
  if (genre === "danger")
    return `<Frame flex="row" items="center" justify="center" px={16} h={40} rounded={10} stroke=${v("destructive")} strokeWidth={1}>${t(s, { weight: 600, color: "destructive" })}</Frame>`;
  return `<Frame flex="row" items="center" justify="center" px={16} h={40} rounded={10} stroke=${v("border")} strokeWidth={1} bg=${v("card")}>${t(s, { weight: 600 })}</Frame>`;
};
const pastille = (s) =>
  `<Frame flex="row" items="center" gap={4} px={6} py={2} rounded={999} stroke=${v("record")} strokeWidth={1}>${icone("trending-up", 11, "record")}${t(s, { size: 11, weight: 600, color: "record" })}</Frame>`;
const champ = (s, actif) =>
  `<Frame flex="row" items="center" justify="center" w={64} h={40} rounded={10} bg=${v("card")} stroke=${v(actif ? "foreground" : "border")} strokeWidth={${actif ? 1.5 : 1}}>${t(s, { size: 17, weight: 600, font: DATA })}</Frame>`;
const coche = (faite) =>
  faite
    ? `<Frame flex="row" items="center" justify="center" w={36} h={36} rounded={10} bg=${v("primary")}>${icone("check", 20, "primary-foreground")}</Frame>`
    : `<Frame w={36} h={36} rounded={10} bg=${v("card")} stroke=${v("border")} strokeWidth={1.5} />`;
const serie = (n, prec, kg, reps, etat) => {
  const faite = etat === "faite" || etat === "record";
  const cellule = (s) =>
    `<Frame flex="row" items="center" justify="center" w={64} h={40}>${t(s, { size: 17, weight: 600, font: DATA })}</Frame>`;
  return `<Frame flex="row" items="center" gap={6} w={380} h={52} px={8} rounded={10} ${faite ? `bg=${v("muted")}` : ""}>
    <Frame w={28}>${t(n, { size: 15, weight: 700, font: DATA })}</Frame>
    <Frame w={92}>${etat === "record" ? pastille("Record") : t(prec, { size: 13, color: "muted-foreground", font: DATA })}</Frame>
    ${faite ? cellule(kg) + cellule(reps) : champ(kg, etat === "active") + champ(reps, etat === "active")}
    <Frame flex="row" justify="end" grow={1}>${coche(faite)}</Frame></Frame>`;
};
const segment = `<Frame flex="row" gap={2} p={3} rounded={12} bg=${v("muted")}>${[
  "4 sem.",
  "3 mois",
  "1 an",
]
  .map(
    (s, i) =>
      `<Frame flex="row" items="center" px={12} h={32} rounded={10} ${i === 1 ? `bg=${v("foreground")}` : ""}>${t(s, { size: 13, weight: 600, color: i === 1 ? "background" : "muted-foreground" })}</Frame>`,
  )
  .join("")}</Frame>`;
const heros = `<Frame flex="col" items="start" gap={10} w={380} p={18} rounded={12} bg=${v("card")} stroke=${v("record")} strokeWidth={1.5}>
  <Frame flex="row" items="center" justify="between" w="fill">${pastille("Meilleure charge")}${legende("3 oct.")}</Frame>
  <Frame flex="row" items="end" gap={10}>${t("100", { size: 72, weight: 600, ls: -2 })}${pile(t("kg", { size: 22, weight: 600, color: "muted-foreground" }) + t("× 6", { size: 22, weight: 600 }), 0)}</Frame>
  ${legende(`+5${fine}kg depuis septembre · 1RM estimé 120${fine}kg`)}</Frame>`;
const composants = section(
  "Composants",
  `${legende("L'action est un aplat de primary, le record un contour de record (même couleur, D28) ; le danger a la sienne, toujours en contour.")}
  ${ligne(
    `${pile(`${legende("Boutons")}${ligne(bouton("Terminer", "plein") + bouton("Ajouter une série", "contour") + bouton("Abandonner", "danger"), 12)}`)}
    ${pile(`${legende("Période")}${segment}`)}
    ${pile(`${legende("Record")}${ligne(pastille("Record") + pastille("1 record"), 10)}`)}`,
    48,
  )}
  ${ligne(
    `${pile(`${legende("Ligne de série : faite, record, active, à faire")}${serie("É", `40 × 10`, "40", "10", "faite")}${serie("1", "", "82,5", "8", "record")}${serie("2", `80 × 8`, "80", "8", "active")}${serie("3", `80 × 7`, "80", "7", "afaire")}`, 4)}
    ${pile(`${legende("Record héros")}${heros}`)}`,
    48,
  )}`,
);

const jsx = `<Frame name="Système A" flex="col" items="start" gap={32} p={40} bg=${v("background")}>${palette}${texte}${composants}</Frame>`;
// Tout cadre sans mise en page reçoit une rangée centrée : sans elle, OpenPencil empile les enfants à l'origine.
const auto = (x) => x.replace(/<Frame(?![^>]*flex=)/g, '<Frame flex="row" items="center"');
writeFileSync(`${tmp}/args.json`, JSON.stringify({ jsx: auto(jsx), x: 0, y: 0 }));
console.log(
  execFileSync(
    "openpencil.cmd",
    ["tool", "call", "render", "--args-file", `${tmp}/args.json`, "--page-id", page, "--json"],
    { shell: true },
  )
    .toString()
    .replace(/\s+/g, " ")
    .slice(0, 300),
);
