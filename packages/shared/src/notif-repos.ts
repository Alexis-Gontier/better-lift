import { formaterCharge } from "./charge.js";
import {
  ajusterRepos,
  arreterRepos,
  type ExerciceEnCours,
  prochaineSerie,
  type SeanceEnCours,
  type SerieEnCours,
} from "./seance.js";
import type { UnitSystem } from "./units.js";

/**
 * La notification de repos du mobile (D338) : ce qu'elle affiche, et l'effet de
 * ses boutons. Pur : le mobile n'y ajoute que notify-kit et le disque.
 */

/** Les boutons de la notification : −15 s, +15 s, Passer. */
export type ActionRepos = "moins" | "plus" | "passer";

export type ContenuNotifRepos = {
  titre: string;
  texte: string;
  /** La fin du repos, en millisecondes : le chrono à rebours d'Android la lit. */
  fin: number;
  /** La durée du repos, pour la barre ; `null` pour un brouillon qui ne l'a pas. */
  duree: number | null;
  /** Les secondes qui restent ; 0 une fois la fin passée. */
  restant: number;
};

/** `null` sans repos : la notification n'a plus lieu d'être. */
export function contenuNotifRepos(
  s: SeanceEnCours,
  maintenant: Date,
  systeme: UnitSystem,
): ContenuNotifRepos | null {
  if (!s.repos) return null;
  const fin = Date.parse(s.repos.fin);
  const base = {
    fin,
    duree: s.repos.duree ?? null,
    restant: Math.max(0, Math.ceil((fin - maintenant.getTime()) / 1000)),
  };
  const p = prochaineSerie(s);
  const e = p ? s.exercices[p.iE] : undefined;
  const serie = p ? e?.series[p.iS] : undefined;
  if (!p || !e || !serie)
    return { ...base, titre: "Repos", texte: "Toutes les séries sont faites" };
  const suite = [
    `Ensuite : série ${p.iS + 1}/${e.series.length}`,
    valeurs(serie, e.precedent?.[p.iS], systeme),
  ];
  return { ...base, titre: `Repos · ${e.nom}`, texte: suite.filter(Boolean).join(" · ") };
}

/**
 * Les valeurs de la série : sa saisie ou sa cible, sinon ce qui a été fait la
 * dernière fois (D67), sinon rien.
 */
function valeurs(
  serie: SerieEnCours,
  precedent: NonNullable<ExerciceEnCours["precedent"]>[number] | undefined,
  systeme: UnitSystem,
): string | null {
  const propre = serie.chargeKg !== null || serie.reps !== null;
  const source = propre ? serie : precedent?.faite ? precedent : null;
  if (!source) return null;
  const charge = source.chargeKg === null ? null : formaterCharge(source.chargeKg, systeme);
  if (charge && source.reps !== null) return `${charge} × ${source.reps}`;
  return charge ?? (source.reps === null ? null : `${source.reps} reps`);
}

/** Les mêmes effets que le bandeau de repos (D79) : ±15 s, ou l'arrêt. */
export function appliquerActionRepos(
  s: SeanceEnCours,
  action: ActionRepos,
  maintenant: Date,
): SeanceEnCours {
  if (action === "passer") return arreterRepos(s);
  return ajusterRepos(s, action === "plus" ? 15 : -15, maintenant);
}
