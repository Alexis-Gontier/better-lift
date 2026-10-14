import { cleJour, type Ecart, formaterCharge } from "@better-lift/shared";
import { plier } from "@/lib/texte";
import { SYSTEME_UNITES } from "@/lib/unites";

/** « 45 min », « 2 h 05 ». */
export function dureeTexte(min: number): string {
  const h = Math.floor(min / 60);
  return h > 0 ? `${h} h ${String(min % 60).padStart(2, "0")}` : `${min} min`;
}

const MOIS = new Intl.DateTimeFormat("fr-FR", { month: "long", year: "numeric", timeZone: "UTC" });

/**
 * Le fil groupé par mois (D140), mois civil dans le fuseau. L'ordre de l'API
 * (antéchronologique) est conservé : une séance rejoint le groupe courant tant
 * que son mois est le même, elle n'est jamais retriée.
 */
export function grouperParMois<T extends { debut: string }>(
  seances: readonly T[],
  fuseau: string,
): { cle: string; libelle: string; seances: T[] }[] {
  const groupes: { cle: string; libelle: string; seances: T[] }[] = [];
  for (const s of seances) {
    const cle = cleJour(s.debut, fuseau).slice(0, 7);
    const dernier = groupes.at(-1);
    if (dernier?.cle === cle) {
      dernier.seances.push(s);
      continue;
    }
    const libelle = MOIS.format(new Date(`${cle}-01T00:00:00Z`));
    groupes.push({
      cle,
      libelle: libelle.charAt(0).toUpperCase() + libelle.slice(1),
      seances: [s],
    });
  }
  return groupes;
}

/** « +2,5 kg », « −1 rep », « = » : l'écart d'une série avec la même position la fois d'avant (D123). */
export function texteEcart(e: Ecart): string {
  if (e.genre === "egal") return "=";
  const signe = (n: number) => (n > 0 ? "+" : "−");
  if (e.genre === "charge") {
    return `${signe(e.deltaKg)}${formaterCharge(Math.abs(e.deltaKg), SYSTEME_UNITES)}`;
  }
  return `${signe(e.delta)}${Math.abs(e.delta)} rep${Math.abs(e.delta) > 1 ? "s" : ""}`;
}

/**
 * Le filtre du fil (D160) : sur le nom et les exercices de l'aperçu, sans casse ni accents.
 * Il porte sur les pages déjà chargées ; « Afficher plus » en apporte d'autres.
 */
export function filtrerSeances<T extends { nom: string; apercu: readonly { nom: string }[] }>(
  seances: readonly T[],
  texte: string,
): T[] {
  const cherche = plier(texte.trim());
  if (!cherche) return [...seances];
  return seances.filter((s) =>
    [s.nom, ...s.apercu.map((e) => e.nom)].some((n) => plier(n).includes(cherche)),
  );
}
