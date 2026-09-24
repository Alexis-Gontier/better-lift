import { LIBELLE_TYPE_SERIE, TYPES_SERIE, type TypeSerie } from "@better-lift/shared";
import type { ReactNode } from "react";
import { SYSTEME_UNITES } from "@/lib/unites";
import { chargeInvalide, repsInvalides, type SerieBrouillon } from "./brouillon";

const UNITE = SYSTEME_UNITES === "imperial" ? "lb" : "kg";

const champ =
  "w-full rounded border bg-(--surface-1) px-2 py-1 font-mono text-xs text-(--ink) outline-none focus-visible:ring-2 focus-visible:ring-(--focus-ring)";

/** Une saisie illisible se voit : bordure du danger, et l'enregistrement se bloque. */
const bordure = (invalide: boolean) => (invalide ? "border-destructive" : "border-(--line)");

export function TableauSeries({
  nomExercice,
  series,
  onChange,
  repos,
}: {
  nomExercice: string;
  series: SerieBrouillon[];
  onChange: (series: SerieBrouillon[]) => void;
  /** Le champ du repos, posé à côté de « + série » : l'en-tête garde la place pour le nom. */
  repos: ReactNode;
}) {
  const modifier = (i: number, patch: Partial<SerieBrouillon>) =>
    onChange(series.map((s, j) => (j === i ? { ...s, ...patch } : s)));

  // « + série » recopie la dernière : on ajoute presque toujours la même.
  const ajouter = () => {
    const derniere = series.at(-1);
    onChange([...series, derniere ? { ...derniere } : { type: "NORMALE", reps: "", charge: "" }]);
  };

  return (
    <div className="px-3 py-2">
      <table className="w-full border-separate border-spacing-y-1 text-xs">
        <thead>
          <tr className="text-left text-[10.5px] uppercase tracking-wide text-(--ink-faint)">
            <th className="w-6 font-normal">#</th>
            <th className="w-32 font-normal">Type</th>
            <th className="font-normal">Reps</th>
            <th className="font-normal">Charge ({UNITE})</th>
            <th className="w-7" />
          </tr>
        </thead>
        <tbody>
          {series.map((s, i) => {
            const etiquette = `${nomExercice}, série ${i + 1}`;
            return (
              <tr key={i}>
                <td className="font-mono text-(--ink-faint)">{i + 1}</td>
                <td className="pr-2">
                  <select
                    aria-label={`${etiquette} : type`}
                    value={s.type}
                    onChange={(e) => modifier(i, { type: e.target.value as TypeSerie })}
                    className={`${champ} ${bordure(false)} font-sans`}
                  >
                    {TYPES_SERIE.map((t) => (
                      <option key={t} value={t}>
                        {LIBELLE_TYPE_SERIE[t]}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="pr-2">
                  <input
                    aria-label={`${etiquette} : répétitions`}
                    inputMode="numeric"
                    placeholder="—"
                    value={s.reps}
                    onChange={(e) => modifier(i, { reps: e.target.value })}
                    aria-invalid={repsInvalides(s.reps) || undefined}
                    className={`${champ} ${bordure(repsInvalides(s.reps))}`}
                  />
                </td>
                <td className="pr-2">
                  <input
                    aria-label={`${etiquette} : charge en ${UNITE}`}
                    inputMode="decimal"
                    placeholder="—"
                    value={s.charge}
                    onChange={(e) => modifier(i, { charge: e.target.value })}
                    aria-invalid={chargeInvalide(s.charge) || undefined}
                    className={`${champ} ${bordure(chargeInvalide(s.charge))}`}
                  />
                </td>
                <td>
                  <button
                    type="button"
                    aria-label={`Retirer la ${etiquette}`}
                    onClick={() => onChange(series.filter((_, j) => j !== i))}
                    className="grid size-6 place-items-center rounded text-(--ink-faint) hover:bg-(--surface-2) hover:text-(--ink) focus-visible:outline-2 focus-visible:outline-(--focus-ring)"
                  >
                    ×
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <div className="mt-1 flex items-center justify-between">
        <button
          type="button"
          onClick={ajouter}
          className="rounded px-2 py-1 text-xs text-(--ink-subtle) hover:bg-(--surface-2) hover:text-(--ink) focus-visible:outline-2 focus-visible:outline-(--focus-ring)"
        >
          + série
        </button>
        {repos}
      </div>
    </div>
  );
}
