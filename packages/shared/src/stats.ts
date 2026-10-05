import { cleJour } from "./calendar.js";
import { type Zone, zoneDuMuscle } from "./muscles.js";
import type { TypeRecord } from "./records.js";

/**
 * Les statistiques (D112) : ce que l'API calcule et que le mobile affiche.
 * Tout se dérive des séances (D58) ; le découpage en semaines et en jours se
 * fait dans le fuseau du profil, jamais en UTC.
 */

export type Semaine = {
  /** Le lundi de la semaine, jour civil « 2026-09-28 ». */
  lundi: string;
  seances: number;
  volumeKg: number;
  /** Les jours entraînés, `jours[0]` = lundi. */
  jours: boolean[];
};

/** Une série qui a établi un ou plusieurs records : une ligne, ses types. */
export type RecordRecent = {
  slug: string;
  nom: string;
  types: TypeRecord[];
  reps: number;
  chargeKg: number | null;
  date: string;
};

export type Stats = {
  /** Toutes les séances du compte : sous deux, les courbes ne disent rien encore. */
  nbSeances: number;
  /** Les 12 dernières semaines, de la plus ancienne à la semaine en cours. */
  semaines: Semaine[];
  /** Les records établis ces 4 dernières semaines, du plus récent au plus ancien. */
  recordsRecents: RecordRecent[];
  /** Les exercices faits ces 4 dernières semaines, pour la carte du corps. */
  muscles: { musclePrincipal: string; musclesSecondaires: string[] }[];
};

const JOUR_MS = 86_400_000;

/** Un jour civil « 2026-10-03 » en millisecondes UTC, pour compter en jours entiers. */
function jourEnMs(cle: string): number {
  const [a, m, j] = cle.split("-").map(Number);
  return Date.UTC(a ?? 0, (m ?? 1) - 1, j ?? 1);
}

/** Le lundi de la semaine de `maintenant` dans le fuseau, et le rang du jour (0 = lundi). */
export function lundiCourant(maintenant: Date, fuseau: string): { lundiMs: number; rang: number } {
  const aujourdhuiMs = jourEnMs(cleJour(maintenant.toISOString(), fuseau));
  // getUTCDay : 0 = dimanche. On veut 0 = lundi.
  const rang = (new Date(aujourdhuiMs).getUTCDay() + 6) % 7;
  return { lundiMs: aujourdhuiMs - rang * JOUR_MS, rang };
}

/**
 * Les `n` dernières semaines, de la plus ancienne à la semaine en cours : par
 * semaine, le nombre de séances, le volume et les jours entraînés.
 */
export function semainesRecentes(
  seances: readonly { debut: string; volumeKg: number }[],
  maintenant: Date,
  fuseau: string,
  n: number,
): Semaine[] {
  const { lundiMs } = lundiCourant(maintenant, fuseau);
  const premierMs = lundiMs - (n - 1) * 7 * JOUR_MS;
  const semaines: Semaine[] = Array.from({ length: n }, (_, i) => ({
    lundi: new Date(premierMs + i * 7 * JOUR_MS).toISOString().slice(0, 10),
    seances: 0,
    volumeKg: 0,
    jours: Array(7).fill(false),
  }));
  for (const s of seances) {
    const ecart = Math.round((jourEnMs(cleJour(s.debut, fuseau)) - premierMs) / JOUR_MS);
    const semaine = semaines[Math.floor(ecart / 7)];
    if (ecart < 0 || !semaine) continue;
    semaine.seances++;
    semaine.volumeKg = Math.round((semaine.volumeKg + s.volumeKg) * 100) / 100;
    semaine.jours[ecart % 7] = true;
  }
  return semaines;
}

// --- Stats par période (D125, D126) -------------------------------------------
// Une période est un nombre de semaines glissantes, alignées sur le lundi dans
// le fuseau, qui finit par la semaine en cours ; elle se compare aux mêmes
// semaines juste avant. Des mois civils auraient des longueurs inégales.

export const PERIODES = ["semaine", "mois", "trimestre", "annee"] as const;
export type Periode = (typeof PERIODES)[number];

export const SEMAINES_PERIODE: Record<Periode, number> = {
  semaine: 1,
  mois: 4,
  trimestre: 13,
  annee: 52,
};

/** Une séance, réduite à ce que les stats d'une période en lisent. */
export type SeancePeriode = {
  id: string;
  debut: string;
  fin: string;
  volumeKg: number;
  seriesFaites: number;
  exercices: {
    musclePrincipal: string;
    musclesSecondaires: string[];
    /** Les séries faites hors échauffement : ce que l'exercice a fait travailler. */
    seriesComptees: number;
  }[];
};

export type Totaux = { seances: number; series: number; dureeMin: number };

/** Un jour entraîné : son volume et ses séances (le calendrier ouvre la première). */
export type JourEntraine = { jour: string; volumeKg: number; seances: string[] };

export type StatsPeriode = {
  periode: Periode;
  nbSemaines: number;
  /** Le premier lundi de la période, jour civil : la première colonne du calendrier. */
  premierLundi: string;
  totaux: Totaux;
  /** Les mêmes chiffres sur les semaines d'avant, pour comparer. */
  precedents: Totaux;
  jours: JourEntraine[];
  /** Le volume de chaque semaine de la période, de la plus ancienne à la courante. */
  volumes: { lundi: string; volumeKg: number }[];
  /** Les séries par zone principale, de la plus travaillée à la moins travaillée. */
  zones: { zone: Zone; series: number }[];
  /** Les exercices de la période, pour la carte du corps. */
  muscles: { musclePrincipal: string; musclesSecondaires: string[] }[];
  /** Les records établis pendant la période, du plus récent au plus ancien. */
  records: RecordRecent[];
  /** Toutes les séances du compte : sous deux, les courbes ne disent rien encore. */
  nbSeances: number;
};

const dureeMin = (s: { debut: string; fin: string }) =>
  Math.round((Date.parse(s.fin) - Date.parse(s.debut)) / 60_000);

/** Tout ce qui se calcule sans l'historique : les records s'ajoutent à part (D64). */
export function calculerPeriode(
  seances: readonly SeancePeriode[],
  maintenant: Date,
  fuseau: string,
  periode: Periode,
): Omit<StatsPeriode, "records" | "nbSeances"> {
  const n = SEMAINES_PERIODE[periode];
  const { lundiMs } = lundiCourant(maintenant, fuseau);
  const premierMs = lundiMs - (n - 1) * 7 * JOUR_MS;
  const precedentMs = premierMs - n * 7 * JOUR_MS;
  const vide = (): Totaux => ({ seances: 0, series: 0, dureeMin: 0 });
  const totaux = vide();
  const precedents = vide();
  const jours = new Map<string, JourEntraine>();
  const zones = new Map<Zone, number>();
  const courantes: SeancePeriode[] = [];

  for (const s of seances) {
    const cle = cleJour(s.debut, fuseau);
    const ms = jourEnMs(cle);
    const cible = ms >= premierMs ? totaux : ms >= precedentMs ? precedents : null;
    if (!cible) continue;
    cible.seances++;
    cible.series += s.seriesFaites;
    cible.dureeMin += dureeMin(s);
    if (cible !== totaux) continue;
    courantes.push(s);
    const jour = jours.get(cle) ?? { jour: cle, volumeKg: 0, seances: [] };
    jour.volumeKg = Math.round((jour.volumeKg + s.volumeKg) * 100) / 100;
    jour.seances.push(s.id);
    jours.set(cle, jour);
    for (const e of s.exercices) {
      const z = zoneDuMuscle(e.musclePrincipal);
      if (z && e.seriesComptees > 0) zones.set(z, (zones.get(z) ?? 0) + e.seriesComptees);
    }
  }

  return {
    periode,
    nbSemaines: n,
    premierLundi: new Date(premierMs).toISOString().slice(0, 10),
    totaux,
    precedents,
    jours: [...jours.values()].sort((a, b) => a.jour.localeCompare(b.jour)),
    volumes: semainesRecentes(courantes, maintenant, fuseau, n).map((s) => ({
      lundi: s.lundi,
      volumeKg: s.volumeKg,
    })),
    zones: [...zones].sort((a, b) => b[1] - a[1]).map(([zone, series]) => ({ zone, series })),
    muscles: courantes.flatMap((s) =>
      s.exercices.map((e) => ({
        musclePrincipal: e.musclePrincipal,
        musclesSecondaires: e.musclesSecondaires,
      })),
    ),
  };
}

/**
 * L'intensité de chaque jour entraîné dans le calendrier (D126), de 1 à 4 :
 * son rang parmi les jours de la période, par quartile de volume. Relative à
 * soi, pas à un seuil en kilos : une semaine légère reste lisible.
 */
export function niveauxCalendrier(jours: readonly JourEntraine[]): Map<string, number> {
  const tries = [...jours].sort((a, b) => a.volumeKg - b.volumeKg);
  const niveaux = new Map<string, number>();
  tries.forEach((j, i) => {
    // À volume égal, le même niveau : on prend le rang du dernier ex aequo.
    let rang = i;
    while (rang + 1 < tries.length && tries[rang + 1]?.volumeKg === j.volumeKg) rang++;
    niveaux.set(j.jour, Math.min(4, Math.max(1, Math.ceil((4 * (rang + 1)) / tries.length))));
  });
  return niveaux;
}
