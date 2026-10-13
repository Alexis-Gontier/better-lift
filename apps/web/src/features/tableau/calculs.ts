import {
  type JourEntraine,
  niveauxCalendrier,
  type Periode,
  type SemaineVolume,
} from "@better-lift/shared";

/** « ↗ +3 », « ↘ −12 % », « = avant » : l'écart avec la période d'avant (D125). */
export function ecart(valeur: number, avant: number, enPourcent: boolean): string {
  if (valeur === avant) return "= avant";
  if (avant === 0) return "rien avant";
  const d = valeur - avant;
  const texte = enPourcent ? `${Math.round((Math.abs(d) / avant) * 100)} %` : String(Math.abs(d));
  return `${d > 0 ? "↗ +" : "↘ −"}${texte}`;
}

export function dureeTexte(min: number): string {
  const h = Math.floor(min / 60);
  return h > 0 ? `${h} h ${String(min % 60).padStart(2, "0")}` : `${min} min`;
}

// --- Dates civiles -----------------------------------------------------------
// Des clés « AAAA-MM-JJ » déjà découpées dans le fuseau par l'API : on les déplace
// en UTC pur, où un jour fait toujours 24 h, et on les formate en UTC.

const JOUR_MS = 86_400_000;
const plusJours = (cle: string, n: number) =>
  new Date(Date.parse(`${cle}T00:00:00Z`) + n * JOUR_MS).toISOString().slice(0, 10);
const formater = (options: Intl.DateTimeFormatOptions) =>
  new Intl.DateTimeFormat("fr-FR", { ...options, timeZone: "UTC" });
const MOIS = formater({ month: "short" });
const JOUR_MOIS = formater({ day: "numeric", month: "short" });
const enDate = (cle: string) => new Date(`${cle}T00:00:00Z`);

// --- Calendrier de 12 mois (D138) ---------------------------------------------

export type CaseCalendrier = {
  jour: string;
  /** 0 sans séance, puis 1 à 4 (D126). */
  niveau: number;
  seances: string[];
  /** Dans la période choisie, et pas dans le futur : en clair. */
  dansPeriode: boolean;
  aujourdhui: boolean;
  futur: boolean;
};

const SEMAINES_ANNEE = 52;

/**
 * La grille de l'année : 52 colonnes (semaines, du lundi `premierLundi`), 7 lignes
 * (lundi → dimanche). Les niveaux se calculent sur l'année entière : le calendrier
 * ne change pas de teinte quand on change de période, seule la mise en avant bouge.
 */
export function grilleAnnee(
  jours: readonly JourEntraine[],
  premierLundi: string,
  debutPeriode: string,
  aujourdhui: string,
): { colonnes: CaseCalendrier[][]; mois: { colonne: number; libelle: string }[] } {
  const niveaux = niveauxCalendrier(jours);
  const parJour = new Map(jours.map((j) => [j.jour, j.seances]));
  const colonnes: CaseCalendrier[][] = [];
  const mois: { colonne: number; libelle: string }[] = [];

  for (let c = 0; c < SEMAINES_ANNEE; c++) {
    const lundi = plusJours(premierLundi, c * 7);
    if (c === 0 || lundi.slice(5, 7) !== plusJours(lundi, -7).slice(5, 7)) {
      mois.push({ colonne: c, libelle: MOIS.format(enDate(lundi)) });
    }
    colonnes.push(
      Array.from({ length: 7 }, (_, r) => {
        const jour = plusJours(lundi, r);
        const futur = jour > aujourdhui;
        return {
          jour,
          niveau: niveaux.get(jour) ?? 0,
          seances: parJour.get(jour) ?? [],
          dansPeriode: jour >= debutPeriode && !futur,
          aujourdhui: jour === aujourdhui,
          futur,
        };
      }),
    );
  }
  return { colonnes, mois };
}

// --- Graphique (D187) ---------------------------------------------------------

export type Mesure = "volume" | "series";
export type Barre = { cle: string; libelle: string; valeur: number; dansPeriode: boolean };

/** Une barre par semaine ; en Année, une par mois, d'après le mois du lundi. */
export function barresGraphique(
  volumes: readonly SemaineVolume[],
  periode: Periode,
  mesure: Mesure,
): Barre[] {
  const valeur = (v: SemaineVolume) => (mesure === "volume" ? v.volumeKg : v.series);
  if (periode !== "annee") {
    return volumes.map((v) => ({
      cle: v.lundi,
      libelle: JOUR_MOIS.format(enDate(v.lundi)),
      valeur: valeur(v),
      dansPeriode: v.dansPeriode,
    }));
  }
  const parMois = new Map<string, Barre>();
  for (const v of volumes) {
    const cle = v.lundi.slice(0, 7);
    const barre = parMois.get(cle) ?? {
      cle,
      libelle: MOIS.format(enDate(`${cle}-01`)),
      valeur: 0,
      dansPeriode: true,
    };
    barre.valeur = Math.round((barre.valeur + valeur(v)) * 100) / 100;
    parMois.set(cle, barre);
  }
  return [...parMois.values()];
}
