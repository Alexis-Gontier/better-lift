import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { GROUPES, type Groupe, slugifier } from "@better-lift/shared";

/**
 * Extrait le catalogue depuis le dataset externe.
 *
 * Script MANUEL, lancé une fois — il ne tourne ni au semis, ni en CI, ni au
 * build. Son résultat, `source.json`, est commité : c'est lui que lisent les
 * tests et le semis, pour que le catalogue ne dépende pas d'un dossier qui vit
 * hors du dépôt.
 *
 *     pnpm --filter @better-lift/db exec tsx catalogue/extraire.ts \
 *       ../../../exercises-dataset/data/exercises.json
 *
 * Trois choses se passent ici, et une seule fois :
 *  - la RÉPARATION des noms abîmés dans la source ;
 *  - la DÉDUPLICATION, huit paires d'entrées étant identiques en tout sauf l'id
 *    et, pour deux d'entre elles, la ponctuation du nom ;
 *  - la RÉDUCTION aux champs utiles — 17,5 Mo de dix langues deviennent 0,89 Mo.
 */

type Brut = {
  id: string;
  name: string;
  body_part: string;
  equipment: string;
  target: string;
  secondary_muscles?: string[];
  gif_url: string;
  instruction_steps: Record<string, string[] | undefined>;
};

type EntreeSource = {
  id: string;
  nom: string;
  groupe: Groupe;
  equipement: string;
  cible: string;
  secondaires: string[];
  gif: string;
  etapes: string[];
};

// « upper legs » -> « UPPER_LEGS ». La correspondance est mécanique, mais elle
// est écrite plutôt que calculée : une valeur inattendue dans la source doit
// faire ÉCHOUER l'extraction, pas produire silencieusement un groupe inventé.
const GROUPE_DEPUIS_DATASET: Record<string, Groupe> = {
  chest: "CHEST",
  back: "BACK",
  shoulders: "SHOULDERS",
  "upper arms": "UPPER_ARMS",
  "lower arms": "LOWER_ARMS",
  "upper legs": "UPPER_LEGS",
  "lower legs": "LOWER_LEGS",
  waist: "WAIST",
  cardio: "CARDIO",
  neck: "NECK",
};

/**
 * Deux défauts d'encodage dans la source, repérés à l'exploration :
 *  - « sled 45в° leg press » et trois variantes : le `°` (C2 B0 en UTF-8) a été
 *    relu en cp1251, ce qui donne « в° ». Quatre entrées.
 *  - « dumbbell rear delt row_shoulder » : un reste de colonne collé au nom.
 * Sans cette réparation, le nom anglais affiché en sous-titre et la recherche
 * porteraient « 45в° ».
 */
function reparer(nom: string): string {
  return nom.replace(/в°/g, "°").replace(/_shoulder$/, "");
}

const chemin = process.argv[2];
if (!chemin) {
  throw new Error("Usage : tsx catalogue/extraire.ts <chemin vers data/exercises.json>");
}

const brut = JSON.parse(readFileSync(chemin, "utf8")) as Brut[];

// Déduplication sur le SLUG du nom réparé, l'id le plus petit l'emportant.
// Six paires d'entrées ne diffèrent que par l'id et le média : « lever chest
// press », « ez barbell spider curl », « barbell seated calf raise », « smith
// reverse calf raises », « self assisted inverse leg curl », « push-up (on
// stability ball) ». Deux autres ne diffèrent en plus que par la ponctuation —
// « dumbbell close-grip press » / « dumbbell close grip press », et « dumbbell
// standing one arm curl (over incline bench) » / « … over incline bench » —
// avec groupe, équipement, cible et muscles identiques : dédupliquer sur le nom
// brut les laisserait passer, et elles tomberaient sur le même slug. Le `slug`
// est `@unique` et c'est la clé de l'`upsert` du semis : cette passe le rend
// unique par construction.
const parSlug = new Map<string, EntreeSource>();

for (const e of [...brut].sort((a, b) => a.id.localeCompare(b.id))) {
  const nom = reparer(e.name);
  const slug = slugifier(nom);
  if (parSlug.has(slug)) continue;

  const groupe = GROUPE_DEPUIS_DATASET[e.body_part];
  if (!groupe) throw new Error(`body_part inconnu : « ${e.body_part} » (id ${e.id})`);

  const etapes = e.instruction_steps.fr;
  if (!etapes?.length) throw new Error(`instructions françaises absentes (id ${e.id})`);

  parSlug.set(slug, {
    id: e.id,
    nom,
    groupe,
    equipement: e.equipment,
    cible: e.target,
    secondaires: e.secondary_muscles ?? [],
    gif: e.gif_url,
    etapes,
  });
}

if (GROUPES.length !== Object.keys(GROUPE_DEPUIS_DATASET).length) {
  throw new Error("La correspondance des groupes ne couvre plus l'union `Groupe` de `shared`.");
}

const sortie = [...parSlug.values()].sort((a, b) => a.id.localeCompare(b.id));
const ici = path.dirname(fileURLToPath(import.meta.url));
writeFileSync(path.join(ici, "source.json"), `${JSON.stringify(sortie, null, 2)}\n`, "utf8");

console.log(`${sortie.length} exercices écrits dans source.json (${brut.length} en entrée)`);
