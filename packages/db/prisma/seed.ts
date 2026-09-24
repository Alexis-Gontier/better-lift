import "./env.js";

import { readFileSync } from "node:fs";
import { type Groupe, slugifier, texteRecherche } from "@better-lift/shared";
import { prisma } from "../src/index.js";

/**
 * Le semis du catalogue.
 *
 * Il ne traduit RIEN : il lit `noms-fr.json`, écrit et commité (D45). Corriger
 * un nom, c'est modifier une ligne de ce fichier et relancer le semis.
 *
 *     pnpm db:seed
 *
 * Il est REJOUABLE : `upsert` sur le slug, jamais `create`. Le slug dérive du
 * nom anglais, qui ne bouge pas ; le relancer ne duplique rien et n'échoue pas.
 */

// Les animations restent dans le dépôt du dataset (D46) : on n'en copie aucune.
// L'URL est FIGÉE sur un commit, pour qu'un renommage en amont ne casse rien.
const BASE_MEDIAS =
  "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/7455efae41b330c265e7cd4b78dfa848e7ce5ebd";

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

type Vocabulaire = {
  equipements: Record<string, string>;
  cibles: Record<string, string>;
  muscles: Record<string, string>;
};

const lire = <T>(nom: string): T =>
  JSON.parse(readFileSync(new URL(`../catalogue/${nom}`, import.meta.url), "utf8")) as T;

const source = lire<EntreeSource[]>("source.json");
const nomsFr = lire<Record<string, string>>("noms-fr.json");
const vocabulaire = lire<Vocabulaire>("vocabulaire.json");

// Les 1 316 lignes en une seule transaction sont lentes depuis Francfort et
// tiennent un verrou bien trop longtemps. Par lots de 100, chaque lot est un
// aller-retour et une transaction courte.
const TAILLE_LOT = 100;

async function semer(): Promise<void> {
  let faits = 0;

  for (let debut = 0; debut < source.length; debut += TAILLE_LOT) {
    const lot = source.slice(debut, debut + TAILLE_LOT);

    await prisma.$transaction(
      lot.map((e) => {
        const nomFr = nomsFr[e.id];
        if (!nomFr) throw new Error(`Aucun nom français pour l'exercice ${e.id} (« ${e.nom} »)`);

        const equipment = vocabulaire.equipements[e.equipement];
        const target = vocabulaire.cibles[e.cible];
        if (!equipment) throw new Error(`Équipement non traduit : « ${e.equipement} »`);
        if (!target) throw new Error(`Cible non traduite : « ${e.cible} »`);

        const secondary = e.secondaires.map((m) => {
          const fr = vocabulaire.muscles[m];
          if (!fr) throw new Error(`Muscle non traduit : « ${m} »`);
          return fr;
        });

        const slug = slugifier(e.nom);
        const donnees = {
          name: e.nom,
          nomFr,
          nomRecherche: texteRecherche(nomFr, e.nom),
          instructions: e.etapes,
          bodyPart: e.groupe,
          target,
          equipment,
          secondary,
          gifUrl: `${BASE_MEDIAS}/${e.gif}`,
        };

        return prisma.exercise.upsert({
          where: { slug },
          create: { slug, ...donnees },
          update: donnees,
        });
      }),
    );

    faits += lot.length;
    console.log(`${faits} / ${source.length}`);
  }
}

await semer();
await prisma.$disconnect();
console.log(`Catalogue semé : ${source.length} exercices.`);
