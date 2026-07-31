/**
 * Vendorise le dataset d'exercices dans packages/db/seed/data/.
 *
 * Le JSON amont pèse 17,4 Mo, dont l'essentiel est constitué des instructions
 * en 10 langues et de leur version en prose. On n'en importe que deux (fr, en)
 * et uniquement sous forme d'étapes (doc 08, « Mapping vers le modèle ») : on
 * vendorise donc une **projection** du dataset, pas sa copie intégrale.
 *
 * L'intention de la doc est préservée — build reproductible, aucune dépendance
 * réseau, mise à jour par commit explicite et relisible — pour un fichier cinq
 * fois plus léger. Ce script est le seul moyen de régénérer ce fichier :
 * ne pas l'éditer à la main.
 *
 * Usage : node scripts/vendor-exercises.mjs [--ref main]
 */
import { createHash } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const OUT_DIR = resolve(ROOT, "packages/db/seed/data");

const REPO = "hasaneyldrm/exercises-dataset";
const LOCALES = ["fr", "en"];

const refIndex = process.argv.indexOf("--ref");
const REF = refIndex === -1 ? "main" : (process.argv[refIndex + 1] ?? "main");

const SOURCE_URL = `https://raw.githubusercontent.com/${REPO}/${REF}/data/exercises.json`;

/** Champs conservés. Tout le reste est écarté volontairement. */
function project(exercise) {
  const steps = {};

  for (const locale of LOCALES) {
    const value = exercise.instruction_steps?.[locale];

    if (Array.isArray(value) && value.length > 0) {
      steps[locale] = value;
    }
  }

  return {
    id: exercise.id,
    name: exercise.name,
    category: exercise.category,
    body_part: exercise.body_part,
    equipment: exercise.equipment,
    target: exercise.target,
    muscle_group: exercise.muscle_group,
    secondary_muscles: exercise.secondary_muscles ?? [],
    instruction_steps: steps,
    media_id: exercise.media_id,
    image: exercise.image,
    gif_url: exercise.gif_url,
    attribution: exercise.attribution,
  };
}

const response = await fetch(SOURCE_URL);

if (!response.ok) {
  throw new Error(`Téléchargement impossible (${response.status}) : ${SOURCE_URL}`);
}

const rawText = await response.text();
const source = JSON.parse(rawText);

if (!Array.isArray(source) || source.length === 0) {
  throw new Error("Format inattendu : un tableau non vide était attendu.");
}

const exercises = source.map(project);

const missingAttribution = exercises.filter((e) => !e.attribution);

if (missingAttribution.length > 0) {
  // L'attribution Gym visual doit rester attachée à chaque exercice (D17).
  throw new Error(`${missingAttribution.length} exercice(s) sans attribution : import refusé.`);
}

const manifest = {
  source: `https://github.com/${REPO}`,
  ref: REF,
  fetchedAt: new Date().toISOString(),
  count: exercises.length,
  locales: LOCALES,
  sourceSha256: createHash("sha256").update(rawText).digest("hex"),
  license: {
    metadata: "MIT",
    media: "© Gym visual — https://gymvisual.com/",
    note: "Médias conservés avec attribution tant que l'app est gratuite (D17).",
  },
};

await mkdir(OUT_DIR, { recursive: true });
await writeFile(resolve(OUT_DIR, "exercises.json"), JSON.stringify(exercises), "utf8");
await writeFile(
  resolve(OUT_DIR, "manifest.json"),
  `${JSON.stringify(manifest, null, 2)}\n`,
  "utf8",
);

const sizeMb = (Buffer.byteLength(JSON.stringify(exercises)) / 1024 / 1024).toFixed(2);

console.warn(`${exercises.length} exercices vendorisés (${sizeMb} Mo) depuis ${REPO}@${REF}.`);
