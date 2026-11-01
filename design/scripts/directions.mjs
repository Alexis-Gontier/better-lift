// Trois directions × trois écrans témoins, générés depuis un seul jeu de valeurs par direction.

import { execFileSync } from "node:child_process";
import { writeFileSync } from "node:fs";

const [page, tmp, seule] = process.argv.slice(2);
const fine = " ";

const DIRECTIONS = {
  A: {
    nom: "A · Instrument sobre",
    ui: "Geist",
    disp: "Geist",
    dispW: 600,
    num: "Geist",
    numW: 600,
    data: "Geist Mono",
    upper: false,
    bg: "#F4F4F2",
    card: "#FFFFFF",
    ink: "#0B0B0C",
    muted: "#68686B",
    line: "#E2E2DF",
    subtle: "#ECECE9",
    accent: "#2440F0",
    accentInk: "#FFFFFF",
    accentSoft: "#E8ECFE",
    danger: "#C8281E",
    r: 10,
    cards: true,
    side: "#ECECE9",
    sideInk: "#0B0B0C",
    sideMuted: "#68686B",
    restBg: "#0B0B0C",
    onInk: "#FFFFFF",
  },
  B: {
    nom: "B · Affiche de salle",
    ui: "Barlow",
    disp: "Barlow Condensed",
    dispW: 800,
    num: "Barlow Condensed",
    numW: 700,
    data: "Barlow Condensed",
    upper: true,
    bg: "#EEECE7",
    card: "#FFFFFF",
    ink: "#141311",
    muted: "#67625A",
    line: "#D8D4CB",
    subtle: "#E4E1D9",
    accent: "#F04E14",
    accentInk: "#141311",
    accentSoft: "#FCE3D8",
    danger: "#B42318",
    r: 4,
    cards: true,
    side: "#141311",
    sideInk: "#FFFFFF",
    sideMuted: "#A39E95",
    restBg: "#141311",
    onInk: "#FFFFFF",
  },
  D: {
    nom: "A sombre · Instrument sobre",
    ui: "Geist",
    disp: "Geist",
    dispW: 600,
    num: "Geist",
    numW: 600,
    data: "Geist Mono",
    upper: false,
    bg: "#0E0E10",
    card: "#17171A",
    ink: "#F2F2F0",
    muted: "#9A9AA0",
    line: "#2A2A2F",
    subtle: "#1F1F23",
    accent: "#7088FF",
    accentInk: "#0B0B0C",
    accentSoft: "#1C2147",
    danger: "#F2554A",
    r: 10,
    cards: true,
    side: "#131316",
    sideInk: "#F2F2F0",
    sideMuted: "#9A9AA0",
    restBg: "#232327",
    onInk: "#0B0B0C",
  },
  C: {
    nom: "C · Carnet d'athlète",
    ui: "Instrument Sans",
    disp: "Newsreader",
    dispW: 500,
    num: "Newsreader",
    numW: 500,
    data: "Instrument Sans",
    upper: false,
    bg: "#FAF8F3",
    card: "#FAF8F3",
    ink: "#1A1917",
    muted: "#6E695F",
    line: "#DCD6CA",
    subtle: "#F0ECE3",
    accent: "#1D3F8F",
    accentInk: "#FFFFFF",
    accentSoft: "#E7ECF7",
    danger: "#B42318",
    r: 3,
    cards: false,
    side: "#F3F0E8",
    sideInk: "#1A1917",
    sideMuted: "#6E695F",
    restBg: "#1A1917",
    onInk: "#FFFFFF",
  },
};

// ——— briques ———
const t = (T, s, o = {}) => {
  const font = o.font ?? T.ui;
  const attrs = [
    `size={${o.size ?? 14}}`,
    `weight={${o.weight ?? 400}}`,
    `font="${font}"`,
    `color="${o.color ?? T.ink}"`,
    o.upper ? 'textCase="UPPER"' : "",
    o.w ? `w="${o.w}"` : "",
    o.align ? `textAlign="${o.align}"` : "",
    o.ls != null ? `letterSpacing={${o.ls}}` : "",
    o.lh ? `lineHeight={${o.lh}}` : "",
  ]
    .filter(Boolean)
    .join(" ");
  return `<Text ${attrs}>${s}</Text>`;
};
const label = (T, s, o = {}) =>
  t(T, s, { size: 11, weight: 500, color: T.muted, upper: T.upper, ls: T.upper ? 0.8 : 0, ...o });
const display = (T, s, size, o = {}) =>
  t(T, s, { size, weight: T.dispW, font: T.disp, upper: T.upper, ls: T.upper ? 0.2 : -0.4, ...o });
const nombre = (T, s, size, o = {}) =>
  t(T, s, { size, weight: T.numW, font: T.num, ls: T.upper ? 0 : -0.3, ...o });
const icone = (nom, size, color) => `<Icon name="lucide:${nom}" size={${size}} color="${color}" />`;

const panneau = (T, inner, o = {}) => {
  const pad = o.pad ?? 16,
    gap = o.gap ?? 12;
  if (T.cards) {
    const stroke = o.record ? T.accent : T.line;
    return `<Frame flex="col" w="fill" gap={${gap}} p={${pad}} bg="${T.card}" rounded={${T.r + 2}} stroke="${stroke}" strokeWidth={${o.record ? 1.5 : 1}}>${inner}</Frame>`;
  }
  if (o.record)
    return `<Frame flex="col" w="fill" gap={${gap}} p={${pad}} bg="${T.accentSoft}" rounded={${T.r}} stroke="${T.accent}" strokeWidth={1}>${inner}</Frame>`;
  return `<Frame flex="col" w="fill" gap={${gap}} pt={${pad}} pb={${Math.round(pad / 2)}} stroke="${T.ink}" strokeWeights={{ top: 1, right: 0, bottom: 0, left: 0 }}>${inner}</Frame>`;
};
const pastilleRecord = (T, s = "Record") =>
  `<Frame flex="row" gap={4} items="center" px={6} py={2} rounded={${T.cards ? 999 : 2}} stroke="${T.accent}" strokeWidth={1}>${icone("trending-up", 11, T.accent)}${t(T, s, { size: 11, weight: 600, color: T.accent, upper: T.upper, ls: T.upper ? 0.6 : 0 })}</Frame>`;
const barreEtat = (T) =>
  `<Frame flex="row" w="fill" h={32} px={20} justify="between" items="center">${t(T, "10:42", { size: 13, weight: 600 })}<Frame flex="row" gap={6} items="center">${icone("wifi", 14, T.ink)}${icone("battery-full", 16, T.ink)}</Frame></Frame>`;
const navAndroid = (T) =>
  `<Frame flex="row" w="fill" h={20} justify="center" items="center"><Frame w={108} h={4} rounded={2} bg="${T.ink}" opacity={0.35} /></Frame>`;

// ——— 1. Séance en cours (mobile) ———
function seance(T) {
  const stat = (l, v) =>
    `<Frame flex="col" gap={2}>${label(T, l)}${nombre(T, v, T.upper ? 24 : 19)}</Frame>`;
  const champ = (v, actif) =>
    `<Frame w={64} h={40} rounded={${T.r}} bg="${T.card}" stroke="${actif ? T.ink : T.line}" strokeWidth={${actif ? 1.5 : 1}} justify="center" items="center">${t(T, v, { size: 17, weight: 600, font: T.data })}</Frame>`;
  const fait = (v) =>
    `<Frame w={64} h={40} justify="center" items="center">${t(T, v, { size: 17, weight: 600, font: T.data })}</Frame>`;
  const coche = (etat) =>
    etat
      ? `<Frame w={36} h={36} rounded={${T.r}} bg="${T.accent}" justify="center" items="center">${icone("check", 20, T.accentInk)}</Frame>`
      : `<Frame w={36} h={36} rounded={${T.r}} stroke="${T.line}" strokeWidth={1.5} bg="${T.card}" />`;
  const ligne = ({ n, prec, kg, reps, etat, actif, record }) => {
    const fond = etat ? `bg="${T.subtle}"` : "";
    const precCell = record
      ? `<Frame w={92} flex="row">${pastilleRecord(T)}</Frame>`
      : `<Frame w={92}>${t(T, prec, { size: 13, color: T.muted, font: T.data })}</Frame>`;
    return `<Frame flex="row" w="fill" h={52} px={8} gap={6} items="center" rounded={${T.r}} ${fond}>
      <Frame w={28}>${t(T, n, { size: 15, weight: 700, font: T.data, color: n === "É" ? T.muted : T.ink })}</Frame>
      ${precCell}
      ${etat ? fait(kg) : champ(kg, actif)}${etat ? fait(reps) : champ(reps, actif)}
      <Frame grow={1} flex="row" justify="end">${coche(etat)}</Frame></Frame>`;
  };
  const enTeteTable = `<Frame flex="row" w="fill" px={8} gap={6}>
    <Frame w={28}>${label(T, "Série", { size: 10 })}</Frame><Frame w={92}>${label(T, "Précédent", { size: 10 })}</Frame>
    <Frame w={64} flex="row" justify="center">${label(T, "kg", { size: 10 })}</Frame><Frame w={64} flex="row" justify="center">${label(T, "Reps", { size: 10 })}</Frame></Frame>`;
  const puce = (ic, s) =>
    `<Frame flex="row" gap={5} items="center" px={10} py={6} rounded={${T.cards ? 999 : T.r}} bg="${T.subtle}">${icone(ic, 13, T.muted)}${t(T, s, { size: 12, weight: 500, color: T.muted })}</Frame>`;
  const vignette = `<Frame w={40} h={40} rounded={${T.r}} bg="#FFFFFF" stroke="${T.line}" strokeWidth={1} justify="center" items="center">${icone("dumbbell", 18, T.muted)}</Frame>`;
  const exo1 = panneau(
    T,
    `
    <Frame flex="row" w="fill" gap={10} items="center">${vignette}<Frame grow={1}>${display(T, "Développé couché à la barre", T.upper ? 20 : 16, { w: "fill" })}</Frame>${icone("ellipsis-vertical", 18, T.muted)}</Frame>
    <Frame flex="row" gap={8}>${puce("timer", "2 min")}${puce("pencil", "Note")}</Frame>
    <Frame flex="col" w="fill" gap={2}>${enTeteTable}
      ${ligne({ n: "É", prec: `40 × 10`, kg: "40", reps: "10", etat: true })}
      ${ligne({ n: "1", prec: `80 × 8`, kg: "82,5", reps: "8", etat: true, record: true })}
      ${ligne({ n: "2", prec: `80 × 8`, kg: "80", reps: "8", actif: true })}
      ${ligne({ n: "3", prec: `80 × 7`, kg: "80", reps: "7" })}</Frame>
    <Frame flex="row" w="fill" h={40} gap={6} justify="center" items="center" rounded={${T.r}} stroke="${T.line}" strokeWidth={1}>${icone("plus", 15, T.ink)}${t(T, "Ajouter une série", { size: 13, weight: 600 })}</Frame>`,
    { pad: 14 },
  );
  const exo2 = panneau(
    T,
    `<Frame flex="row" w="fill" gap={10} items="center">${vignette}<Frame grow={1}>${display(T, "Développé incliné aux haltères", T.upper ? 20 : 16, { w: "fill" })}</Frame>${icone("ellipsis-vertical", 18, T.muted)}</Frame>
    <Frame flex="row" gap={8}>${puce("timer", "1 min 30")}${puce("pencil", "Note")}</Frame>${enTeteTable}`,
    { pad: 14 },
  );
  const bouton = (s) =>
    `<Frame w={52} h={44} rounded={${T.r}} stroke="#FFFFFF" strokeWidth={1} opacity={0.9} justify="center" items="center">${t(T, s, { size: 14, weight: 600, color: "#FFFFFF", font: T.data })}</Frame>`;
  const repos = `<Frame flex="row" w="fill" h={76} px={14} gap={10} items="center" bg="${T.restBg}">
    ${bouton("−15")}<Frame grow={1} flex="col" items="center">${label(T, "Repos", { color: "#A8A8A8" })}${nombre(T, "1:34", T.upper ? 34 : 28, { color: "#FFFFFF" })}</Frame>${bouton("+15")}
    <Frame px={16} h={44} rounded={${T.r}} bg="${T.accent}" justify="center" items="center">${t(T, "Passer", { size: 15, weight: 700, color: T.accentInk, upper: T.upper })}</Frame></Frame>`;
  return `<Frame name="${T.nom} / Séance" w={412} h={915} flex="col" bg="${T.bg}" overflow="hidden">${barreEtat(T)}
    <Frame flex="row" w="fill" px={12} py={6} gap={8} items="center">${icone("chevron-down", 24, T.ink)}<Frame grow={1}>${display(T, "Push A", T.upper ? 28 : 21)}</Frame>
      <Frame px={16} h={40} rounded={${T.r}} bg="${T.accent}" justify="center" items="center">${t(T, "Terminer", { size: 14, weight: 700, color: T.accentInk, upper: T.upper })}</Frame></Frame>
    <Frame flex="row" w="fill" px={16} pt={4} pb={12} gap={28} items="end">${stat("Durée", "12:48")}${stat("Volume", `2${fine}340 kg`)}${stat("Séries", "5/16")}</Frame>
    <Frame w="fill" px={16}><Frame w="fill" h={3} bg="${T.line}"><Frame w={119} h={3} bg="${T.ink}" /></Frame></Frame>
    <Frame flex="col" w="fill" grow={1} gap={12} p={12} overflow="hidden">${exo1}${exo2}</Frame>
    ${repos}${navAndroid(T)}</Frame>`;
}

// ——— 2. Page d'exercice, bloc Records (mobile) ———
function records(T) {
  const sec = (l, v, d) =>
    `<Frame flex="col" grow={1} gap={3}>${label(T, l)}${nombre(T, v, T.upper ? 26 : 20)}${t(T, d, { size: 12, color: T.muted })}</Frame>`;
  const sep = `<Frame w={1} h={56} bg="${T.line}" />`;
  // Nuage de points en cadres : OpenPencil met mal à l'échelle un svg à viewBox.
  const unRM = [98, 99, 101, 100, 104, 105, 104, 110, 120, 116];
  const graphe = `<Frame flex="col" w="fill" gap={8}>
    <Frame flex="row" w="fill" h={120} items="end" justify="between" stroke="${T.line}" strokeWeights={{ top: 0, right: 0, bottom: 1, left: 0 }}>${unRM
      .map((v) => {
        const record = v === 120;
        const d = record ? 14 : 8;
        const point = record
          ? `<Frame w={${d}} h={${d}} rounded={999} bg="${T.bg}" stroke="${T.accent}" strokeWidth={2.5} />`
          : `<Frame w={${d}} h={${d}} rounded={999} bg="${T.ink}" />`;
        return `<Frame flex="col" w={24} h="fill" items="center" justify="end" pb={${Math.round((v - 96) * 4.2)}}>${record ? t(T, "120", { size: 11, weight: 700, color: T.accent }) : ""}${point}</Frame>`;
      })
      .join("")}</Frame>
    <Frame flex="row" w="fill" justify="between">${["août", "sept.", "oct."].map((m) => t(T, m, { size: 11, color: T.muted })).join("")}</Frame></Frame>`;
  const histo = (
    j,
    s,
    v,
  ) => `<Frame flex="row" w="fill" py={12} items="center" stroke="${T.line}" strokeWeights={{ top: 1, right: 0, bottom: 0, left: 0 }}>
    <Frame flex="col" grow={1} gap={2}>${t(T, j, { size: 15, weight: 600 })}${t(T, s, { size: 13, color: T.muted, font: T.data })}</Frame>${t(T, v, { size: 13, color: T.muted, font: T.data })}${icone("chevron-right", 16, T.muted)}</Frame>`;
  const heros = panneau(
    T,
    `
    <Frame flex="row" w="fill" justify="between" items="center">${pastilleRecord(T, "Meilleure charge")}${t(T, "3 oct.", { size: 12, color: T.muted })}</Frame>
    <Frame flex="row" gap={10} items="baseline">${nombre(T, "100", T.upper ? 96 : 72, { lh: T.upper ? 88 : 72 })}<Frame flex="col">${nombre(T, "kg", T.upper ? 30 : 22, { color: T.muted })}${nombre(T, "× 6", T.upper ? 30 : 22)}</Frame></Frame>
    ${t(T, `+5${fine}kg depuis septembre · 1RM estimé 120${fine}kg`, { size: 13, color: T.muted })}`,
    { pad: 18, gap: 10, record: true },
  );
  return `<Frame name="${T.nom} / Records" w={412} h={915} flex="col" bg="${T.bg}" overflow="hidden">${barreEtat(T)}
    <Frame flex="row" w="fill" px={12} py={8} gap={8} items="center">${icone("chevron-left", 24, T.ink)}<Frame flex="col" grow={1}>${display(T, "Développé couché à la barre", T.upper ? 24 : 19, { w: "fill" })}</Frame></Frame>
    <Frame flex="col" w="fill" grow={1} gap={16} px={16} pt={8} overflow="hidden">
      ${display(T, "Records", T.upper ? 22 : 17)}
      ${heros}
      ${panneau(T, `<Frame flex="row" w="fill" gap={14} items="start">${sec("1RM estimé", `120${fine}kg`, "3 oct.")}${sep}${sec("Volume max", `4${fine}620${fine}kg`, "24 sept.")}${sep}${sec("Séances", "11", "dern. 20 oct.")}</Frame>`, { pad: 14 })}
      ${panneau(T, `<Frame flex="row" w="fill" justify="between" items="center">${display(T, "1RM estimé", T.upper ? 18 : 15)}${t(T, "3 mois", { size: 12, color: T.muted })}</Frame>${graphe}`, { pad: 14, gap: 10 })}
      <Frame flex="col" w="fill">${display(T, "Historique", T.upper ? 22 : 17)}<Frame h={8} />
        ${histo("Mardi 20 octobre", `40 × 10 · 80 × 8`, "1RM 101")}${histo("Mardi 13 octobre", `40 × 10 · 90 × 5`, "1RM 105")}${histo("Samedi 3 octobre", `40 × 10 · 100 × 6`, "1RM 120")}</Frame>
    </Frame>${navAndroid(T)}</Frame>`;
}

// ——— 3. Accueil (web) ———
function accueil(T) {
  const nav = (ic, s, actif) =>
    `<Frame flex="row" w="fill" h={36} px={10} gap={10} items="center" rounded={${T.r}} ${actif ? `bg="${T.side === T.ink ? "#2A2825" : T.card}"` : ""}>${icone(ic, 17, actif ? T.sideInk : T.sideMuted)}${t(T, s, { size: 14, weight: actif ? 600 : 500, color: actif ? T.sideInk : T.sideMuted })}</Frame>`;
  const cote = `<Frame flex="col" w={232} h="fill" p={16} gap={4} bg="${T.side}" ${T.cards ? "" : `stroke="${T.line}" strokeWeights={{ top: 0, right: 1, bottom: 0, left: 0 }}`}>
    <Frame h={44} flex="row" items="center" px={6}>${display(T, "better-lift", T.upper ? 24 : 19, { color: T.sideInk })}</Frame><Frame h={12} />
    ${nav("layout-dashboard", "Accueil", true)}${nav("list-checks", "Routines")}${nav("history", "Historique")}${nav("trophy", "Records")}${nav("dumbbell", "Exercices")}</Frame>`;
  const seg = (s, actif) =>
    `<Frame px={12} h={32} justify="center" items="center" rounded={${T.r}} ${actif ? `bg="${T.ink}"` : ""}>${t(T, s, { size: 13, weight: 600, color: actif ? T.onInk : T.muted })}</Frame>`;
  const jour = (j, etat) => {
    if (etat === "fait")
      return `<Frame w={30} h={30} rounded={999} bg="${T.ink}" justify="center" items="center">${t(T, j, { size: 12, weight: 600, color: T.onInk })}</Frame>`;
    if (etat === "auj")
      return `<Frame w={30} h={30} rounded={999} stroke="${T.ink}" strokeWidth={1.5} justify="center" items="center">${t(T, j, { size: 12, weight: 600 })}</Frame>`;
    return `<Frame w={30} h={30} rounded={999} stroke="${T.line}" strokeWidth={1} justify="center" items="center">${t(T, j, { size: 12, color: T.muted })}</Frame>`;
  };
  const semaine = panneau(
    T,
    `<Frame flex="row" w="fill" gap={20} items="center">${display(T, "Cette semaine", T.upper ? 20 : 16)}
    <Frame flex="row" gap={8}>${jour("L", "fait")}${jour("M")}${jour("M", "fait")}${jour("J")}${jour("V")}${jour("S", "auj")}${jour("D")}</Frame>
    <Frame grow={1} /><Frame flex="row" gap={4} items="baseline">${nombre(T, "2", T.upper ? 28 : 22)}${t(T, "/ 3 séances", { size: 13, color: T.muted })}</Frame>
    <Frame w={160} h={4} bg="${T.line}"><Frame w={107} h={4} bg="${T.ink}" /></Frame></Frame>`,
    { pad: 16 },
  );
  const chiffre = (l, v, record) =>
    `<Frame flex="col" grow={1} gap={4} px={20}>${label(T, l)}${nombre(T, v, T.upper ? 44 : 32, { color: record ? T.accent : T.ink })}${t(T, "vs 9 la période d'avant", { size: 12, color: T.muted })}</Frame>`;
  const sepV = `<Frame w={1} h={72} bg="${T.line}" />`;
  const chiffres = panneau(
    T,
    `<Frame flex="row" w="fill" items="center">${chiffre("Séances", "13")}${sepV}${chiffre("Volume", `11${fine}920 kg`)}${sepV}${chiffre("Séries", "186")}${sepV}${chiffre("Records battus", "8", true)}</Frame>`,
    { pad: 18 },
  );
  const hauteurs = [0, 0, 1, 2, 0, 3, 5, 4, 5, 2, 0, 3, 2];
  const barres = `<Frame flex="row" w="fill" h={170} gap={10} items="end">${hauteurs
    .map(
      (h, i) =>
        `<Frame flex="col" grow={1} h="fill" justify="end" items="center" gap={6}><Frame w="fill" h={${Math.max(2, h * 26)}} rounded={${Math.min(T.r, 4)}} bg="${h ? T.ink : T.line}" ${i === 12 ? "opacity={0.45}" : ""} /></Frame>`,
    )
    .join("")}</Frame>
    <Frame flex="row" w="fill" justify="between">${["3 août", "17 août", "31 août", "14 sept.", "28 sept.", "12 oct.", "26 oct."].map((m) => t(T, m, { size: 11, color: T.muted })).join("")}</Frame>`;
  const tendance = panneau(
    T,
    `<Frame flex="row" w="fill" justify="between" items="center">${display(T, "Tendance", T.upper ? 20 : 16)}<Frame flex="row" gap={2}>${seg("Séances", true)}${seg("Volume")}</Frame></Frame>${barres}`,
    { pad: 18, gap: 14 },
  );
  const ligneSeance = (
    n,
    d,
    v,
    rec,
  ) => `<Frame flex="row" w="fill" py={11} gap={12} items="center" stroke="${T.line}" strokeWeights={{ top: 1, right: 0, bottom: 0, left: 0 }}>
    <Frame flex="col" grow={1} gap={2}>${t(T, n, { size: 14, weight: 600 })}${t(T, d, { size: 12, color: T.muted })}</Frame>${rec ? pastilleRecord(T, "1 record") : ""}${t(T, v, { size: 14, weight: 600, font: T.data })}</Frame>`;
  const dernieres = panneau(
    T,
    `<Frame flex="row" w="fill" justify="between" items="center">${display(T, "Dernières séances", T.upper ? 20 : 16)}${t(T, "Tout l'historique", { size: 13, weight: 600 })}</Frame>
    <Frame flex="col" w="fill">${ligneSeance("Push A", "20 oct. · 47 min", "640 kg")}${ligneSeance("Push mobile", "20 oct. · 30 min", "450 kg")}${ligneSeance("Pull A", "13 oct. · 52 min", "630 kg", true)}</Frame>`,
    { pad: 18, gap: 6 },
  );
  const ligneRecord = (
    n,
    v,
    d,
  ) => `<Frame flex="row" w="fill" py={10} gap={10} items="center" stroke="${T.line}" strokeWeights={{ top: 1, right: 0, bottom: 0, left: 0 }}>
    <Frame flex="col" grow={1} gap={2}>${t(T, n, { size: 14, weight: 600 })}${t(T, d, { size: 12, color: T.muted })}</Frame>${nombre(T, v, T.upper ? 20 : 16)}</Frame>`;
  const recordsRecents = panneau(
    T,
    `${display(T, "Records récents", T.upper ? 20 : 16)}
    ${panneau(
      T,
      `<Frame flex="row" w="fill" justify="between" items="center">${pastilleRecord(T)}${t(T, "13 oct.", { size: 12, color: T.muted })}</Frame>
      ${t(T, "Rowing buste penché à la barre", { size: 14, weight: 600 })}
      <Frame flex="row" gap={8} items="baseline">${nombre(T, "70 kg", T.upper ? 52 : 38)}${nombre(T, "× 9", T.upper ? 28 : 22, { color: T.muted })}</Frame>
      ${t(T, "Charge, 1RM estimé et volume battus", { size: 12, color: T.muted })}`,
      { pad: 14, gap: 6, record: true },
    )}
    <Frame flex="col" w="fill">${ligneRecord("Développé couché à la barre", "100 × 6", "3 oct. · charge, 1RM")}${ligneRecord("Soulevé de terre à la barre", "140 × 5", "3 oct. · charge, 1RM, volume")}${ligneRecord("Développé couché à la barre", "87,5 × 6", "3 oct. · charge")}</Frame>`,
    { pad: 18, gap: 12 },
  );
  const muscles = panneau(
    T,
    `${display(T, "Muscles", T.upper ? 20 : 16)}<Frame w="fill" h={150} rounded={${T.r}} bg="${T.subtle}" justify="center" items="center">${t(T, "Silhouette existante (D331), à la couleur de la direction", { size: 12, color: T.muted })}</Frame>`,
    { pad: 18 },
  );
  return `<Frame name="${T.nom} / Accueil" w={1440} h={900} flex="row" bg="${T.bg}" overflow="hidden">${cote}
    <Frame flex="col" grow={1} h="fill" px={40} pt={28} gap={18} overflow="hidden">
      <Frame flex="row" w="fill" justify="between" items="center">${display(T, "Accueil", T.upper ? 44 : 32)}<Frame flex="row" gap={2} p={3} rounded={${T.r + 2}} bg="${T.subtle}">${seg("4 sem.")}${seg("3 mois", true)}${seg("1 an")}</Frame></Frame>
      ${semaine}${chiffres}
      <Frame flex="row" w="fill" gap={18} items="start">
        <Frame flex="col" grow={1} gap={18}>${tendance}${dernieres}</Frame>
        <Frame flex="col" w={420} gap={18}>${recordsRecents}${muscles}</Frame></Frame>
    </Frame></Frame>`;
}

// ——— rendu ———
// Tout cadre sans mise en page reçoit une rangée centrée : sans elle, OpenPencil empile les enfants à l'origine.
const auto = (jsx) =>
  jsx
    .replace(/<Frame(?![^>]*flex=)/g, '<Frame flex="row" items="center"')
    .replace(/<Frame flex="col"(?![^>]*items=)/g, '<Frame flex="col" items="start"');
const op = (nom, args) => {
  if (args.jsx) args = { ...args, jsx: auto(args.jsx) };
  writeFileSync(`${tmp}/args.json`, JSON.stringify(args));
  return execFileSync(
    "openpencil.cmd",
    ["tool", "call", nom, "--args-file", `${tmp}/args.json`, "--page-id", page, "--json"],
    { shell: true, maxBuffer: 1e8 },
  ).toString();
};
const lignes = Object.entries(DIRECTIONS).filter(([k]) => !seule || seule === k);
for (const [k, T] of lignes) {
  const anciens = JSON.parse(op("find_nodes", { name: T.nom }));
  for (const n of anciens.nodes ?? anciens.results ?? anciens)
    if (n.name?.startsWith(T.nom)) op("delete_node", { id: n.id });
  const y = { A: 0, B: 1200, C: 2400, D: 3600 }[k];
  const titre = `<Frame name="${T.nom} / Titre" flex="col" gap={6}>${t(T, T.nom, { size: 40, weight: 700, font: T.disp, upper: T.upper })}${t(T, `${T.disp} · ${T.ui} · accent ${T.accent} · rayon ${T.r}`, { size: 16, color: T.muted })}</Frame>`;
  const ecrans = [
    [titre, 0, y],
    [seance(T), 0, y + 90],
    [records(T), 452, y + 90],
    [accueil(T), 904, y + 90],
  ];
  for (const [jsx, x, yy] of ecrans) {
    const res = op("render", { jsx, x, y: yy });
    const court = res.replace(/\s+/g, " ").slice(0, 160);
    console.log(k, court);
  }
}
