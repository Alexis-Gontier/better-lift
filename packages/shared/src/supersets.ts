/**
 * Les supersets (D145–D148) — sans plateforme, génériques : les mêmes règles
 * servent le brouillon de routine et la séance en cours.
 *
 * Un groupe est une suite CONSÉCUTIVE d'exercices portant le même numéro. Les
 * numéros n'ont pas de sens en soi : `normaliserGroupes` les renumérote, coupe
 * ce qui ne se suit plus et efface un groupe réduit à un seul. Toute opération
 * finit par elle — un groupe n'est jamais coupé en silence.
 */

export type AvecGroupe = { supersetGroupe?: number | null };
export type Groupe = { debut: number; fin: number; lettre: string };

const num = (x: AvecGroupe | undefined) => x?.supersetGroupe ?? null;
const avec = <T extends AvecGroupe>(x: T, n: number | null): T => ({ ...x, supersetGroupe: n });

/** Les suites maximales d'un même numéro non nul, d'au moins deux exercices. */
function suites(liste: readonly AvecGroupe[]): { debut: number; fin: number }[] {
  const res: { debut: number; fin: number }[] = [];
  let i = 0;
  while (i < liste.length) {
    const n = num(liste[i]);
    let j = i + 1;
    if (n !== null) while (j < liste.length && num(liste[j]) === n) j++;
    if (n !== null && j - i >= 2) res.push({ debut: i, fin: j - 1 });
    i = j;
  }
  return res;
}

/** A, B… Z, puis 27, 28 : au-delà de 26 groupes, une lettre ne se lit plus. */
const lettre = (rang: number) => (rang < 26 ? String.fromCharCode(65 + rang) : String(rang + 1));

export function normaliserGroupes<T extends AvecGroupe>(liste: readonly T[]): T[] {
  const res = liste.map((x) => avec(x, null));
  suites(liste).forEach(({ debut, fin }, rang) => {
    for (let k = debut; k <= fin; k++) res[k] = avec(liste[k] as T, rang + 1);
  });
  return res;
}

export function groupes(liste: readonly AvecGroupe[]): Groupe[] {
  return suites(liste).map((s, rang) => ({ ...s, lettre: lettre(rang) }));
}

export function groupeDe(liste: readonly AvecGroupe[], i: number): Groupe | null {
  return groupes(liste).find((g) => g.debut <= i && i <= g.fin) ?? null;
}

/** Lie `i` à `i + 1` (D147) ; fusionne leurs groupes s'ils en ont. */
export function lierAuSuivant<T extends AvecGroupe>(liste: readonly T[], i: number): T[] {
  if (i < 0 || i + 1 >= liste.length) return [...liste];
  const propre = normaliserGroupes(liste);
  const a = num(propre[i]);
  const b = num(propre[i + 1]);
  const max = Math.max(0, ...propre.map((x) => num(x) ?? 0));
  const cible = a ?? b ?? max + 1;
  return normaliserGroupes(
    propre.map((x, k) => {
      const n = num(x);
      const dedans = k === i || k === i + 1 || (n !== null && (n === a || n === b));
      return dedans ? avec(x, cible) : x;
    }),
  );
}

/** Détache `i` (D147) ; du milieu, il se place juste après le groupe. */
export function retirerDuGroupe<T extends AvecGroupe>(liste: readonly T[], i: number): T[] {
  const propre = normaliserGroupes(liste);
  const g = groupeDe(propre, i);
  if (!g) return propre;
  const res = [...propre];
  res[i] = avec(propre[i] as T, null);
  if (i > g.debut && i < g.fin) {
    const [sorti] = res.splice(i, 1);
    if (sorti) res.splice(g.fin, 0, sorti);
  }
  return normaliserGroupes(res);
}

export function defaireGroupe<T extends AvecGroupe>(liste: readonly T[], i: number): T[] {
  const propre = normaliserGroupes(liste);
  const g = groupeDe(propre, i);
  if (!g) return propre;
  return normaliserGroupes(propre.map((x, k) => (k >= g.debut && k <= g.fin ? avec(x, null) : x)));
}

/**
 * D148 : l'exercice déplacé quitte son groupe ; posé entre deux membres d'un
 * même groupe, il le rejoint. Sur un bord, il reste seul.
 */
export function deplacerAvecGroupes<T extends AvecGroupe>(
  liste: readonly T[],
  de: number,
  vers: number,
): T[] {
  const n = liste.length;
  if (de < 0 || de >= n || vers < 0 || vers >= n || de === vers) return [...liste];
  const res = normaliserGroupes(liste);
  const [bouge] = res.splice(de, 1);
  if (!bouge) return res;
  const avant = num(res[vers - 1]);
  const apres = num(res[vers]);
  res.splice(vers, 0, avec(bouge, avant !== null && avant === apres ? avant : null));
  return normaliserGroupes(res);
}
