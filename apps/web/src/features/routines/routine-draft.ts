import {
  type Brouillon,
  brouillonValide,
  chargeEnTexte,
  empreinte,
  groupeDe,
  lireCharge,
  resumeSeries,
  type SerieBrouillon,
} from "@better-lift/shared";
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

/**
 * Le résumé d'un exercice replié (D253) : le calcul vit dans `shared` (D321), le web y garde
 * « W » pour l'échauffement. Une cible illisible compte comme absente.
 */
export function setsSummary(series: readonly SerieBrouillon[]): string {
  return resumeSeries(
    series.map((s) => {
      const kg = lireCharge(s.charge, SYSTEME);
      return {
        type: s.type,
        reps: /^\d+$/.test(s.reps.trim()) ? Number(s.reps) : null,
        kg: kg === null || Number.isNaN(kg) ? null : kg,
      };
    }),
    SYSTEME,
    "W",
  );
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
