// Pose les captures de design/existant dans la page « 0 · Existant » d'OpenPencil.

import { execFileSync } from "node:child_process";
import { readdirSync, readFileSync, writeFileSync } from "node:fs";

const [racine, page, tmp] = process.argv.slice(2);
const groupes = [
  ["Web · sombre", "web/sombre", 0.5],
  ["Web · clair", "web/clair", 0.5],
  ["Mobile · clair", "mobile/clair", 1 / 3],
];
const ordreMobile = [
  "routines",
  "routine",
  "seance",
  "seance-repos",
  "fin-seance",
  "historique",
  "seance-detail",
  "exercice-1",
  "exercice-2",
  "profil",
];
const dims = (f) => {
  const b = readFileSync(f);
  return [b.readUInt32BE(16), b.readUInt32BE(20)];
};
const op = (nom, args) => {
  writeFileSync(`${tmp}/args.json`, JSON.stringify(args));
  return execFileSync(
    "openpencil.cmd",
    ["tool", "call", nom, "--args-file", `${tmp}/args.json`, "--page-id", page, "--json"],
    { shell: true, maxBuffer: 1e8 },
  ).toString();
};
const images = [];
let jsx = '<Frame name="Existant" flex="col" gap={160} p={80} bg="#E5E5E5">';
for (const [titre, dossier, k] of groupes) {
  let fichiers = readdirSync(`${racine}/${dossier}`)
    .filter((f) => f.endsWith(".png"))
    .map((f) => f.slice(0, -4));
  if (dossier.startsWith("mobile")) fichiers = ordreMobile.filter((f) => fichiers.includes(f));
  jsx += `<Frame name="${titre}" flex="col" gap={32}><Text size={48} weight="bold" color="#171717">${titre}</Text><Frame flex="row" gap={48} items="start">`;
  for (const f of fichiers) {
    const [w, h] = dims(`${racine}/${dossier}/${f}.png`);
    const nom = `${titre} / ${f}`;
    images.push([nom, `${racine}/${dossier}/${f}.png`]);
    jsx += `<Frame flex="col" gap={12}><Text size={20} color="#404040">${f}</Text><Rectangle name="${nom}" w={${Math.round(w * k)}} h={${Math.round(h * k)}} bg="#FFFFFF" /></Frame>`;
  }
  jsx += "</Frame></Frame>";
}
jsx += "</Frame>";
op("render", { jsx, x: 0, y: 0 });
for (const [nom, fichier] of images) {
  const res = JSON.parse(op("find_nodes", { name: nom }));
  const id = (res.nodes ?? res.results ?? res).find((n) => n.name === nom)?.id;
  op("set_image_fill", {
    id,
    image_data: readFileSync(fichier).toString("base64"),
    scale_mode: "FILL",
  });
  console.log("ok", nom, id);
}
