import { cleJour } from "./calendar.js";
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
