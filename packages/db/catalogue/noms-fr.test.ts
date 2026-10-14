import { readFileSync } from "node:fs";
import { CIBLES, EQUIPEMENTS, EQUIPEMENTS_PRINCIPAUX } from "@better-lift/shared";
import { describe, expect, it } from "vitest";

type EntreeSource = {
  id: string;
  nom: string;
  equipement: string;
  cible: string;
  secondaires: string[];
};

const lire = <T>(nom: string): T =>
  JSON.parse(readFileSync(new URL(`./${nom}`, import.meta.url), "utf8")) as T;

const source = lire<EntreeSource[]>("source.json");
const nomsFr = lire<Record<string, string>>("noms-fr.json");
const vocabulaire = lire<{
  equipements: Record<string, string>;
  cibles: Record<string, string>;
  muscles: Record<string, string>;
}>("vocabulaire.json");

describe("noms-fr.json", () => {
  // Le message nomme les exercices en cause, avec leur nom anglais : on sait
  // quoi écrire sans aller fouiller `source.json`.
  it("donne un nom français à chacun des exercices de la source", () => {
    const manquants = source
      .filter((e) => !nomsFr[e.id]?.trim())
      .map((e) => `${e.id} « ${e.nom} »`);
    expect(manquants).toEqual([]);
  });

  // Une entrée sur un id absent de la source ne fait rien et ne le dit pas —
  // typiquement une faute de frappe dans l'id, qui laisse le vrai sans nom.
  it("ne porte aucun id inconnu de la source", () => {
    const ids = new Set(source.map((e) => e.id));
    expect(Object.keys(nomsFr).filter((id) => !ids.has(id))).toEqual([]);
  });

  it("n'a ni espace en bord, ni minuscule initiale", () => {
    const fautifs = Object.entries(nomsFr).filter(
      ([, nom]) => nom !== nom.trim() || nom[0] !== nom[0]?.toLocaleUpperCase("fr"),
    );
    expect(fautifs).toEqual([]);
  });

  // Deux exercices distincts affichés sous le même nom seraient
  // indistinguables dans la liste. Le typage ne l'interdit pas, ce test si :
  // quand deux noms anglais retombent sur le même français, c'est le détail que
  // l'anglais porte (prise, inclinaison, un bras…) qui doit les départager.
  it("ne donne jamais deux fois le même nom", () => {
    const parNom = new Map<string, string[]>();
    for (const [id, nom] of Object.entries(nomsFr)) {
      parNom.set(nom, [...(parNom.get(nom) ?? []), id]);
    }
    const doublons = [...parNom.entries()]
      .filter(([, ids]) => ids.length > 1)
      .map(([nom, ids]) => `« ${nom} » <- ${ids.join(", ")}`);
    expect(doublons).toEqual([]);
  });

  // Lu dans le TEXTE du fichier, pas via `Object.keys` : un objet JavaScript range
  // les clés numériques canoniques (« 1000 ») avant les autres (« 0001 »), ce qui
  // rendrait ce test faux quel que soit l'ordre réel du fichier.
  it("garde ses clés triées par id, pour que le diff reste lisible", () => {
    const texte = readFileSync(new URL("./noms-fr.json", import.meta.url), "utf8");
    const cles = [...texte.matchAll(/^\s*"(\d{4})":/gm)].map((m) => m[1]);
    expect(cles).toHaveLength(Object.keys(nomsFr).length);
    expect(cles).toEqual([...cles].sort());
  });
});

describe("vocabulaire.json", () => {
  /**
   * L'exhaustivité que le typage ne tient pas. Pour `bodyPart`, c'est
   * `Record<Groupe, string>` qui refuse de compiler (D41) ; pour les trois
   * vocabulaires restants, c'est ce test — et il porte sur les valeurs
   * RÉELLEMENT présentes dans la source, ce qui est plus fort qu'une liste
   * recopiée à la main.
   */
  it("traduit tous les équipements, cibles et muscles présents dans la source", () => {
    const manquants: string[] = [];
    for (const e of source) {
      if (!vocabulaire.equipements[e.equipement]) manquants.push(`équipement « ${e.equipement} »`);
      if (!vocabulaire.cibles[e.cible]) manquants.push(`cible « ${e.cible} »`);
      for (const m of e.secondaires) {
        if (!vocabulaire.muscles[m]) manquants.push(`muscle « ${m} »`);
      }
    }
    expect([...new Set(manquants)].sort()).toEqual([]);
  });
});

describe("vocabulaire de la grille d'exercices (D200)", () => {
  const traduire = (table: Record<string, string>, cle: string) => table[cle] ?? cle;
  const cibles = new Set(source.map((e) => traduire(vocabulaire.cibles, e.cible)));
  const equipements = new Set(source.map((e) => traduire(vocabulaire.equipements, e.equipement)));

  it("CIBLES couvre exactement les muscles ciblés du catalogue", () => {
    expect([...CIBLES].sort()).toEqual([...cibles].sort());
  });

  it("EQUIPEMENTS couvre exactement les équipements du catalogue", () => {
    expect([...EQUIPEMENTS].sort()).toEqual([...equipements].sort());
  });

  it("EQUIPEMENTS_PRINCIPAUX n'invente aucun équipement", () => {
    expect(EQUIPEMENTS_PRINCIPAUX.filter((e) => !equipements.has(e))).toEqual([]);
  });
});
