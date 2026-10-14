import { cleJour, type Ecart, formaterCharge } from "@better-lift/shared";
import { fold } from "@/lib/text";
import { UNIT_SYSTEM } from "@/lib/units";

/** « 45 min », « 2 h 05 ». */
export function durationText(min: number): string {
  const h = Math.floor(min / 60);
  return h > 0 ? `${h} h ${String(min % 60).padStart(2, "0")}` : `${min} min`;
}

const MONTH = new Intl.DateTimeFormat("fr-FR", { month: "long", year: "numeric", timeZone: "UTC" });

/**
 * Le fil groupé par mois (D140), mois civil dans le fuseau. L'ordre de l'API
 * (antéchronologique) est conservé : une séance rejoint le groupe courant tant
 * que son mois est le même, elle n'est jamais retriée.
 */
export function groupByMonth<T extends { debut: string }>(
  sessions: readonly T[],
  timeZone: string,
): { cle: string; libelle: string; seances: T[] }[] {
  const groups: { cle: string; libelle: string; seances: T[] }[] = [];
  for (const s of sessions) {
    const key = cleJour(s.debut, timeZone).slice(0, 7);
    const last = groups.at(-1);
    if (last?.cle === key) {
      last.seances.push(s);
      continue;
    }
    const label = MONTH.format(new Date(`${key}-01T00:00:00Z`));
    groups.push({
      cle: key,
      libelle: label.charAt(0).toUpperCase() + label.slice(1),
      seances: [s],
    });
  }
  return groups;
}

/** « +2,5 kg », « −1 rep », « = » : l'écart d'une série avec la même position la fois d'avant (D123). */
export function deltaText(e: Ecart): string {
  if (e.genre === "egal") return "=";
  const sign = (n: number) => (n > 0 ? "+" : "−");
  if (e.genre === "charge") {
    return `${sign(e.deltaKg)}${formaterCharge(Math.abs(e.deltaKg), UNIT_SYSTEM)}`;
  }
  return `${sign(e.delta)}${Math.abs(e.delta)} rep${Math.abs(e.delta) > 1 ? "s" : ""}`;
}

/**
 * Le filtre du fil (D160) : sur le nom et les exercices de l'aperçu, sans casse ni accents.
 * Il porte sur les pages déjà chargées ; « Afficher plus » en apporte d'autres.
 */
export function filterSessions<T extends { nom: string; apercu: readonly { nom: string }[] }>(
  sessions: readonly T[],
  text: string,
): T[] {
  const searching = fold(text.trim());
  if (!searching) return [...sessions];
  return sessions.filter((s) =>
    [s.nom, ...s.apercu.map((e) => e.nom)].some((n) => fold(n).includes(searching)),
  );
}
