import { z } from "zod";
import { cleJour } from "./calendar.js";
import type { Zone } from "./muscles.js";
import type { TypeRecord } from "./records.js";

/**
 * Le tableau de bord de l'Accueil du web (D330). L'API rend les FAITS de chaque séance depuis
 * une date ; ce module les agrège dans le fuseau de l'appelant — le samedi 21 h à Paris est
 * déjà dimanche en UTC. Tout se dérive à la lecture (D58).
 */

export const PERIODES = ["4s", "3m", "1a"] as const;
export type Periode = (typeof PERIODES)[number];
export const LIBELLE_PERIODE: Record<Periode, string> = {
  "4s": "4 sem.",
  "3m": "3 mois",
  "1a": "1 an",
};

export const requeteTableauDeBord = z.object({ depuis: z.iso.datetime() });

/** Une série qui a battu au moins un record, à ce moment-là (D64). */
export type RecordSeance = {
  slug: string;
  nom: string;
  types: TypeRecord[];
  reps: number | null;
  chargeKg: number | null;
};

export type FaitSeance = {
  id: string;
  nom: string;
  debut: string;
  fin: string;
  seriesFaites: number;
  volumeKg: number;
  /** Séries faites hors échauffement, comptées pour la zone du muscle principal. */
  seriesParZone: Partial<Record<Zone, number>>;
  /** Les muscles du catalogue, pour la carte du corps du web. */
  muscles: { principaux: string[]; secondaires: string[] };
  records: RecordSeance[];
};

export type TableauDeBord = {
  /** Depuis `depuis`, la plus récente d'abord. */
  seances: FaitSeance[];
  /** Les séances de toujours : 0 = jamais de séance, état vide. */
  total: number;
  objectifHebdo: number | null;
  routineASuivre: { id: string; nom: string } | null;
};

export type Bornes = {
  unite: "semaine" | "mois";
  /** Le premier jour civil de chaque intervalle, du plus ancien à celui en cours. */
  intervalles: string[];
  /** Le premier jour de la période. */
  debut: string;
  /** Le premier jour de la période précédente, de même longueur. */
  precedente: string;
};

const JOUR_MS = 86_400_000;
const enMs = (jour: string) => Date.parse(`${jour}T00:00:00.000Z`);
const enJour = (ms: number) => new Date(ms).toISOString().slice(0, 10);
const moisDecale = (jour: string, n: number) => {
  const d = new Date(enMs(jour));
  return enJour(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + n, 1));
};

/** Les intervalles de la période, découpés dans le fuseau. */
export function bornesPeriode(periode: Periode, maintenant: Date, fuseau: string): Bornes {
  const aujourdhui = cleJour(maintenant.toISOString(), fuseau);
  if (periode === "1a") {
    const mois = `${aujourdhui.slice(0, 7)}-01`;
    const intervalles = Array.from({ length: 12 }, (_, i) => moisDecale(mois, i - 11));
    const debut = intervalles[0] ?? mois;
    return { unite: "mois", intervalles, debut, precedente: moisDecale(debut, -12) };
  }
  const n = periode === "4s" ? 4 : 13;
  // getUTCDay : 0 = dimanche. On veut 0 = lundi.
  const rang = (new Date(enMs(aujourdhui)).getUTCDay() + 6) % 7;
  const lundi = enMs(aujourdhui) - rang * JOUR_MS;
  const intervalles = Array.from({ length: n }, (_, i) =>
    enJour(lundi - (n - 1 - i) * 7 * JOUR_MS),
  );
  const debut = intervalles[0] ?? enJour(lundi);
  return {
    unite: "semaine",
    intervalles,
    debut,
    precedente: enJour(enMs(debut) - n * 7 * JOUR_MS),
  };
}

/**
 * L'instant à demander à l'API : un jour avant la période précédente, à minuit UTC. La marge
 * couvre tout décalage de fuseau ; ce qui la tombe est écarté à l'agrégation.
 */
export const depuisPour = (b: Bornes) => new Date(enMs(b.precedente) - JOUR_MS).toISOString();

const jour = (s: FaitSeance, fuseau: string) => cleJour(s.debut, fuseau);
const dans = (s: FaitSeance, b: Bornes, fuseau: string) => jour(s, fuseau) >= b.debut;
const avant = (s: FaitSeance, b: Bornes, fuseau: string) => {
  const j = jour(s, fuseau);
  return j >= b.precedente && j < b.debut;
};

export type Chiffres = { seances: number; volumeKg: number; series: number; records: number };
export type ChiffresCles = { actuelle: Chiffres; precedente: Chiffres | null };

function compter(seances: readonly FaitSeance[]): Chiffres {
  return {
    seances: seances.length,
    volumeKg: Math.round(seances.reduce((v, s) => v + s.volumeKg, 0)),
    series: seances.reduce((n, s) => n + s.seriesFaites, 0),
    records: seances.reduce((n, s) => n + s.records.length, 0),
  };
}

/** La période et la précédente ; sans séance dans la précédente, pas de comparaison. */
export function chiffresCles(
  seances: readonly FaitSeance[],
  b: Bornes,
  fuseau: string,
): ChiffresCles {
  const precedentes = seances.filter((s) => avant(s, b, fuseau));
  return {
    actuelle: compter(seances.filter((s) => dans(s, b, fuseau))),
    precedente: precedentes.length > 0 ? compter(precedentes) : null,
  };
}

/** Les sept jours de la semaine en cours, lundi d'abord, et ses séances. */
export function semaineEnCours(seances: readonly FaitSeance[], maintenant: Date, fuseau: string) {
  const lundi = bornesPeriode("4s", maintenant, fuseau).intervalles.at(-1) ?? "";
  const jours = Array.from({ length: 7 }, () => false);
  let n = 0;
  for (const s of seances) {
    const ecart = Math.round((enMs(jour(s, fuseau)) - enMs(lundi)) / JOUR_MS);
    if (ecart < 0 || ecart > 6) continue;
    jours[ecart] = true;
    n++;
  }
  return { jours, seances: n };
}

/** Séances et volume par intervalle, chacun présent même vide. */
export function tendance(seances: readonly FaitSeance[], b: Bornes, fuseau: string) {
  const points = b.intervalles.map((debut) => ({ debut, seances: 0, volumeKg: 0 }));
  for (const s of seances) {
    const j = jour(s, fuseau);
    if (j < b.debut) continue;
    // Le dernier intervalle commencé au plus tard ce jour-là.
    let i = -1;
    b.intervalles.forEach((d, k) => {
      if (d <= j) i = k;
    });
    const point = points[i];
    if (!point) continue;
    point.seances++;
    point.volumeKg = Math.round(point.volumeKg + s.volumeKg);
  }
  return points;
}

/** Les séries par zone sur la période, triées ; les muscles réunis pour le dessin. */
export function repartitionMuscles(seances: readonly FaitSeance[], b: Bornes, fuseau: string) {
  const parZone = new Map<Zone, number>();
  const principaux = new Set<string>();
  const secondaires = new Set<string>();
  for (const s of seances.filter((x) => dans(x, b, fuseau))) {
    for (const [zone, n] of Object.entries(s.seriesParZone) as [Zone, number][]) {
      parZone.set(zone, (parZone.get(zone) ?? 0) + n);
    }
    for (const m of s.muscles.principaux) principaux.add(m);
    for (const m of s.muscles.secondaires) secondaires.add(m);
  }
  return {
    zones: [...parZone]
      .map(([zone, series]) => ({ zone, series }))
      .sort((a, b2) => b2.series - a.series),
    principaux: [...principaux],
    secondaires: [...secondaires].filter((m) => !principaux.has(m)),
  };
}

/** Les `n` derniers records battus sur la période, la séance la plus récente d'abord. */
export function recordsRecents(
  seances: readonly FaitSeance[],
  b: Bornes,
  fuseau: string,
  n: number,
) {
  return seances
    .filter((s) => dans(s, b, fuseau))
    .flatMap((s) => s.records.map((r) => ({ ...r, date: s.debut, seanceId: s.id })))
    .slice(0, n);
}
