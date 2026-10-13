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

/** Le bilan de toujours (D128) : l'en-tête du Profil. */
export type Bilan = {
  nbSeances: number;
  /** Le volume de toutes les séances, en kilos, arrondi. */
  volumeKg: number;
  /** La première séance, ISO 8601 ; `null` sans séance. */
  depuis: string | null;
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

/** Le graphique montre au moins douze semaines, toute la période au-delà (D187). */
export const SEMAINES_GRAPHIQUE = 12;
/** Les semaines d'avant la période qui servent de référence aux muscles (D188). */
export const SEMAINES_REFERENCE = 8;

/**
 * Combien de semaines l'API lit pour une période : la plus longue des trois
 * fenêtres (période + précédente, référence, graphique), plus une de marge pour
 * le découpage civil, qui se fait ensuite dans le fuseau.
 */
export function semainesALire(periode: Periode): number {
  const n = SEMAINES_PERIODE[periode];
  return Math.max(2 * n, n + SEMAINES_REFERENCE, SEMAINES_GRAPHIQUE) + 1;
}

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

/** `series` : les séries de travail, hors échauffement, comme le volume (D5, D186). */
export type Totaux = { seances: number; series: number; dureeMin: number; volumeKg: number };

/** Une semaine du graphique (D187). */
export type SemaineVolume = {
  lundi: string;
  volumeKg: number;
  seances: number;
  /** Les séries de travail. */
  series: number;
  /** La semaine appartient à la période choisie. */
  dansPeriode: boolean;
};

/** Les séries d'une zone, et sa référence : la moyenne des 8 semaines d'avant × n (D188). */
export type ZonePeriode = { zone: Zone; series: number; reference: number };

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
  /** Les `max(12, n)` dernières semaines, de la plus ancienne à la courante (D187). */
  volumes: SemaineVolume[];
  /** Les zones travaillées pendant la période ou la référence, de la plus travaillée à la moins. */
  zones: ZonePeriode[];
  /** Les exercices de la période, pour la carte du corps. */
  muscles: { musclePrincipal: string; musclesSecondaires: string[] }[];
  /** Les records établis pendant la période, du plus récent au plus ancien. */
  records: RecordRecent[];
  /** Toutes les séances du compte : sous deux, les courbes ne disent rien encore. */
  nbSeances: number;
};

const dureeMin = (s: { debut: string; fin: string }) =>
  Math.round((Date.parse(s.fin) - Date.parse(s.debut)) / 60_000);

const arrondi = (n: number) => Math.round(n * 100) / 100;
const seriesDeTravail = (s: SeancePeriode) =>
  s.exercices.reduce((total, e) => total + e.seriesComptees, 0);

function ajouterZones(zones: Map<Zone, number>, s: SeancePeriode) {
  for (const e of s.exercices) {
    const z = zoneDuMuscle(e.musclePrincipal);
    if (z && e.seriesComptees > 0) zones.set(z, (zones.get(z) ?? 0) + e.seriesComptees);
  }
}

/** Tout ce qui se calcule sans l'historique : les records s'ajoutent à part (D64). */
export function calculerPeriode(
  seances: readonly SeancePeriode[],
  maintenant: Date,
  fuseau: string,
  periode: Periode,
  /** D190 : combien de périodes en arrière ; 0, la période en cours. */
  decalage = 0,
): Omit<StatsPeriode, "records" | "nbSeances"> {
  const n = SEMAINES_PERIODE[periode];
  const SEMAINE_MS = 7 * JOUR_MS;
  const courant = lundiCourant(maintenant, fuseau);
  // D190 : reculer de `decalage` périodes. Une période passée est complète.
  const lundiMs = courant.lundiMs - decalage * n * SEMAINE_MS;
  const rang = decalage > 0 ? 6 : courant.rang;
  const premierMs = lundiMs - (n - 1) * SEMAINE_MS;
  const finMs = lundiMs + SEMAINE_MS;
  const precedentMs = premierMs - n * SEMAINE_MS;
  // D185 : la période en cours se compare au même moment de la précédente.
  const joursEcoules = (n - 1) * 7 + rang;
  const referenceMs = premierMs - SEMAINES_REFERENCE * SEMAINE_MS;
  const nbBarres = Math.max(SEMAINES_GRAPHIQUE, n);
  const graphiqueMs = lundiMs - (nbBarres - 1) * SEMAINE_MS;

  const vide = (): Totaux => ({ seances: 0, series: 0, dureeMin: 0, volumeKg: 0 });
  const totaux = vide();
  const precedents = vide();
  const jours = new Map<string, JourEntraine>();
  const zones = new Map<Zone, number>();
  const zonesReference = new Map<Zone, number>();
  const courantes: SeancePeriode[] = [];
  const volumes: SemaineVolume[] = Array.from({ length: nbBarres }, (_, i) => {
    const ms = graphiqueMs + i * SEMAINE_MS;
    return {
      lundi: new Date(ms).toISOString().slice(0, 10),
      volumeKg: 0,
      seances: 0,
      series: 0,
      dansPeriode: ms >= premierMs,
    };
  });

  const ajouter = (t: Totaux, s: SeancePeriode, series: number) => {
    t.seances++;
    t.series += series;
    t.dureeMin += dureeMin(s);
    t.volumeKg = arrondi(t.volumeKg + s.volumeKg);
  };

  for (const s of seances) {
    const cle = cleJour(s.debut, fuseau);
    const ms = jourEnMs(cle);
    if (ms >= finMs) continue;
    const series = seriesDeTravail(s);

    const semaine =
      ms >= graphiqueMs ? volumes[Math.floor((ms - graphiqueMs) / SEMAINE_MS)] : undefined;
    if (semaine) {
      semaine.seances++;
      semaine.series += series;
      semaine.volumeKg = arrondi(semaine.volumeKg + s.volumeKg);
    }
    if (ms >= referenceMs && ms < premierMs) ajouterZones(zonesReference, s);

    if (ms >= premierMs) {
      ajouter(totaux, s, series);
      courantes.push(s);
      const jour = jours.get(cle) ?? { jour: cle, volumeKg: 0, seances: [] };
      jour.volumeKg = arrondi(jour.volumeKg + s.volumeKg);
      jour.seances.push(s.id);
      jours.set(cle, jour);
      ajouterZones(zones, s);
    } else if (ms >= precedentMs && (ms - precedentMs) / JOUR_MS <= joursEcoules) {
      ajouter(precedents, s, series);
    }
  }

  const toutesZones = new Set<Zone>([...zones.keys(), ...zonesReference.keys()]);
  return {
    periode,
    nbSemaines: n,
    premierLundi: new Date(premierMs).toISOString().slice(0, 10),
    totaux,
    precedents,
    jours: [...jours.values()].sort((a, b) => a.jour.localeCompare(b.jour)),
    volumes,
    zones: [...toutesZones]
      .map((zone) => ({
        zone,
        series: zones.get(zone) ?? 0,
        reference: Math.round(((zonesReference.get(zone) ?? 0) / SEMAINES_REFERENCE) * n),
      }))
      .sort((a, b) => b.series - a.series || b.reference - a.reference),
    muscles: courantes.flatMap((s) =>
      s.exercices.map((e) => ({
        musclePrincipal: e.musclePrincipal,
        musclesSecondaires: e.musclesSecondaires,
      })),
    ),
  };
}

/** Un jour de la semaine en cours, pour la bande de l'Accueil (D166). */
export type JourSemaine = { jour: string; entraine: boolean; aujourdhui: boolean; avenir: boolean };

/**
 * Les sept jours de la semaine qui commence à `premierLundi` (jour civil), du
 * lundi au dimanche : entraîné ou non, aujourd'hui, à venir. « Aujourd'hui » se
 * lit dans le fuseau, jamais en UTC.
 */
export function joursDeLaSemaine(
  premierLundi: string,
  jours: readonly JourEntraine[],
  maintenant: Date,
  fuseau: string,
): JourSemaine[] {
  const entraines = new Set(jours.map((j) => j.jour));
  const aujourdhui = cleJour(maintenant.toISOString(), fuseau);
  const lundiMs = jourEnMs(premierLundi);
  return Array.from({ length: 7 }, (_, i) => {
    const jour = new Date(lundiMs + i * JOUR_MS).toISOString().slice(0, 10);
    return {
      jour,
      entraine: entraines.has(jour),
      aujourdhui: jour === aujourdhui,
      avenir: jour > aujourdhui,
    };
  });
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

/**
 * Les semaines de la période où l'objectif est tenu (D126, D128). La semaine en
 * cours ne compte que si elle l'a déjà atteint : elle n'est pas finie.
 */
export function semainesTenues(
  volumes: readonly { seances: number }[],
  objectif: number,
): { tenues: number; sur: number } {
  const courante = volumes.at(-1);
  const comptees = courante && courante.seances < objectif ? volumes.slice(0, -1) : volumes;
  return {
    tenues: comptees.filter((v) => v.seances >= objectif).length,
    sur: comptees.length,
  };
}
