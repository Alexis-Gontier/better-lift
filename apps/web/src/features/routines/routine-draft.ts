import {
  type Brouillon,
  brouillonValide,
  chargeEnTexte,
  empreinte,
  groupeDe,
  lireCharge,
  type SerieBrouillon,
  type TypeSerie,
} from "@better-lift/shared";
import { plural } from "@/lib/format";
import { SYSTEME } from "@/lib/locale";

/**
 * L'éditeur de routine du web travaille sur le `Brouillon` de `shared` (D85) : la copie de
 * travail commune au mobile, charges et répétitions en texte, supersets et validation compris.
 * Ce module ne garde que ce que l'éditeur du web montre à sa façon.
 */

/** Le brouillon diffère-t-il de la version enregistrée ? Les espaces autour du nom et de la note ne comptent pas. */
export function isDirty(draft: Brouillon, saved: Brouillon): boolean {
  const propre = (b: Brouillon) => ({ ...b, nom: b.nom.trim(), note: b.note?.trim() });
  return empreinte(propre(draft)) !== empreinte(propre(saved));
}

/** Pourquoi la routine ne s'enregistre pas encore, ou `null` si elle le peut (D252). */
export function saveBlocker(draft: Brouillon): string | null {
  if (draft.nom.trim() === "") return "Donnez-lui un nom";
  if (draft.exercices.length === 0) return "Ajoutez au moins un exercice";
  if (!brouillonValide(draft, SYSTEME)) return "Vérifiez les charges et répétitions";
  return null;
}

/**
 * Les types de série, dans l'ordre du menu de Hevy ; `short` est l'étiquette de la ligne et
 * `tone` sa couleur (seule couleur de l'éditeur : elle porte un sens, D249).
 */
export const SET_TYPES: readonly {
  value: TypeSerie;
  label: string;
  short: string;
  tone: string;
}[] = [
  { value: "ECHAUFFEMENT", label: "Échauffement", short: "W", tone: "text-amber-500" },
  { value: "NORMALE", label: "Normale", short: "", tone: "text-foreground" },
  // Rose plutôt que rouge : le rouge appartient au danger (D36, D252).
  { value: "ECHEC", label: "Échec", short: "F", tone: "text-rose-600" },
  { value: "DEGRESSIVE", label: "Dégressive", short: "D", tone: "text-sky-500" },
];

/** La couleur de l'étiquette d'une série. */
export function setTone(type: TypeSerie): string {
  return SET_TYPES.find((t) => t.value === type)?.tone ?? "text-foreground";
}

/**
 * L'étiquette de chaque série, comme dans Hevy : W, F ou D pour une série typée, et un numéro
 * pour les séries normales, comptées entre elles (W, 1, 2, D → W 1 2 D).
 */
export function setLabels(series: readonly { type: TypeSerie }[]): string[] {
  let n = 0;
  return series.map((s) =>
    s.type === "NORMALE" ? String(++n) : (SET_TYPES.find((t) => t.value === s.type)?.short ?? "?"),
  );
}

/** La lettre du superset de l'exercice `i` (A, B…), ou `null` hors groupe. */
export function supersetLetter(
  exercices: readonly { supersetGroupe: number | null }[],
  i: number,
): string | null {
  return groupeDe(exercices, i)?.lettre ?? null;
}

/** « Même charge partout » : la première série normale donne sa charge et ses répétitions aux autres séries normales. */
export function copyFirstToAll(series: readonly SerieBrouillon[]): SerieBrouillon[] {
  const first = series.find((s) => s.type === "NORMALE");
  if (!first) return [...series];
  return series.map((s) =>
    s.type === "NORMALE" ? { ...s, charge: first.charge, reps: first.reps } : s,
  );
}

/** Une série de la dernière séance, telle que la rend `GET /seances/precedentes`. */
export type SeriePrecedente = { reps: number | null; chargeKg: number | null; faite: boolean };

/**
 * « Recopier la dernière fois » : chaque série reprend la série de même rang de la dernière
 * séance, ou la dernière connue au-delà.
 */
export function fromLastTime(
  series: readonly SerieBrouillon[],
  last: readonly SeriePrecedente[] | undefined,
): SerieBrouillon[] {
  if (!last || last.length === 0) return [...series];
  return series.map((s, i) => {
    const p = last[i] ?? last.at(-1);
    if (!p) return s;
    return {
      ...s,
      reps: p.reps === null ? "" : String(p.reps),
      charge: p.chargeKg === null ? "" : chargeEnTexte(p.chargeKg, SYSTEME),
    };
  });
}

/** « 10–12 », ou une seule valeur ; `format` met en forme chaque borne. */
function range(values: readonly number[], format: (n: number) => string): string {
  const min = Math.min(...values);
  const max = Math.max(...values);
  return min === max ? format(max) : `${format(min)}–${format(max)}`;
}

/**
 * Le résumé d'un exercice replié (D253) : « 3 × 12 · 10 kg », des plages quand les séries
 * varient (« 3 × 10–12 · 8–10 kg »), les échauffements devant (« 1 W + 3 × 12 »).
 */
export function setsSummary(series: readonly SerieBrouillon[]): string {
  const warmups = series.filter((s) => s.type === "ECHAUFFEMENT").length;
  const working = series.filter((s) => s.type !== "ECHAUFFEMENT");
  if (working.length === 0) return warmups > 0 ? `${warmups} W` : "Aucune série";
  // Une cible peut manquer : on résume ce qui est noté, sans « — » inutile.
  const reps = working.flatMap((s) => (/^\d+$/.test(s.reps.trim()) ? [Number(s.reps)] : []));
  const kgs = working.flatMap((s) => {
    const kg = lireCharge(s.charge, SYSTEME);
    return kg === null || Number.isNaN(kg) ? [] : [kg];
  });
  const count =
    reps.length === 0
      ? plural(working.length, "série")
      : `${working.length} × ${range(reps, String)}`;
  const load = kgs.length === 0 ? "" : ` · ${range(kgs, (n) => String(n).replace(".", ","))} kg`;
  return `${warmups > 0 ? `${warmups} W + ` : ""}${count}${load}`;
}

/** Ce que le brouillon change à la version enregistrée (D261) : de quoi marquer et compter. */
export type ChangeSummary = {
  /** Exercices déjà là, dont un réglage a bougé (par clé). */
  changed: ReadonlySet<string>;
  /** Exercices ajoutés depuis l'ouverture (par clé). */
  added: ReadonlySet<string>;
  removed: number;
  /** Le nom, le dossier, la note, l'ordre : un changement chacun. */
  others: number;
  count: number;
};

/** Les clés suivent les exercices : le brouillon et sa version enregistrée partagent les leurs. */
export function changeSummary(draft: Brouillon, saved: Brouillon): ChangeSummary {
  const sansCle = ({ cle: _cle, ...e }: Brouillon["exercices"][number]) => JSON.stringify(e);
  const before = new Map(saved.exercices.map((e) => [e.cle, sansCle(e)]));
  const changed = new Set<string>();
  const added = new Set<string>();
  for (const e of draft.exercices) {
    const was = before.get(e.cle);
    if (was === undefined) added.add(e.cle);
    else if (was !== sansCle(e)) changed.add(e.cle);
  }
  const kept = draft.exercices.filter((e) => before.has(e.cle)).map((e) => e.cle);
  const removed = before.size - kept.length;
  const order = saved.exercices.map((e) => e.cle).filter((c) => kept.includes(c));
  const others =
    Number(draft.nom.trim() !== saved.nom.trim()) +
    Number(draft.dossierId !== saved.dossierId) +
    Number((draft.note ?? "").trim() !== (saved.note ?? "").trim()) +
    Number(kept.join() !== order.join());
  return { changed, added, removed, others, count: changed.size + added.size + removed + others };
}
