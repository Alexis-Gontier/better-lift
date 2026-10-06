import {
  chargeInvalide,
  etiquettesSeries,
  LIBELLE_TYPE_SERIE,
  repsInvalides,
  type SerieBrouillon,
  TYPES_SERIE,
  type TypeSerie,
} from "@better-lift/shared";
import { Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SYSTEME_UNITES } from "@/lib/unites";

const UNITE = SYSTEME_UNITES === "imperial" ? "lb" : "kg";

/** Une case de saisie : chiffres centrés, grands, dans une boîte nette. */
const CASE = "h-9 w-20 text-center text-sm tabular-nums";

export function TableauSeries({
  nomExercice,
  series,
  onChange,
}: {
  nomExercice: string;
  series: SerieBrouillon[];
  onChange: (series: SerieBrouillon[]) => void;
}) {
  const modifier = (i: number, patch: Partial<SerieBrouillon>) =>
    onChange(series.map((s, j) => (j === i ? { ...s, ...patch } : s)));

  // « + série » recopie la dernière : on ajoute presque toujours la même.
  const ajouter = () => {
    const derniere = series.at(-1);
    onChange([...series, derniere ? { ...derniere } : { type: "NORMALE", reps: "", charge: "" }]);
  };

  const etiquettes = etiquettesSeries(series.map((s) => s.type));

  return (
    <div className="pb-2">
      {/* Une grille plutôt qu'un tableau : chaque ligne est un formulaire, et la
          colonne de retrait n'apparaît qu'au survol de sa ligne. */}
      <div
        aria-hidden="true"
        className="grid grid-cols-[3rem_1fr_5rem_5rem_2rem] items-center gap-2 border-t border-(--line) px-4 py-2 text-xs font-medium text-(--ink-subtle)"
      >
        <span>Série</span>
        <span>Type</span>
        <span className="text-center">{UNITE}</span>
        <span className="text-center">Reps</span>
        <span />
      </div>

      <ol>
        {series.map((s, i) => {
          const etiquette = `${nomExercice}, série ${i + 1}`;
          return (
            <li
              // Les séries n'ont pas d'identité propre : leur rang en tient lieu.
              key={i}
              className="group/serie grid grid-cols-[3rem_1fr_5rem_5rem_2rem] items-center gap-2 px-4 py-1"
            >
              <span
                className={`text-sm font-semibold ${
                  s.type === "ECHAUFFEMENT" ? "text-(--ink-subtle)" : "text-(--ink)"
                }`}
              >
                {etiquettes[i]}
              </span>
              <Select value={s.type} onValueChange={(v) => modifier(i, { type: v as TypeSerie })}>
                <SelectTrigger
                  aria-label={`${etiquette} : type`}
                  size="sm"
                  className="w-fit border-transparent bg-transparent px-2 text-(--ink-subtle) shadow-none hover:border-(--line) dark:bg-transparent"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TYPES_SERIE.map((t) => (
                    <SelectItem key={t} value={t}>
                      {LIBELLE_TYPE_SERIE[t]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {/* Une saisie illisible se voit : `aria-invalid` porte la bordure du
                  danger, et l'enregistrement se bloque. */}
              <Input
                aria-label={`${etiquette} : charge en ${UNITE}`}
                inputMode="decimal"
                placeholder="—"
                value={s.charge}
                onChange={(e) => modifier(i, { charge: e.target.value })}
                aria-invalid={chargeInvalide(s.charge, SYSTEME_UNITES) || undefined}
                className={CASE}
              />
              <Input
                aria-label={`${etiquette} : répétitions`}
                inputMode="numeric"
                placeholder="—"
                value={s.reps}
                onChange={(e) => modifier(i, { reps: e.target.value })}
                aria-invalid={repsInvalides(s.reps) || undefined}
                className={CASE}
              />
              <Button
                variant="ghost"
                size="icon"
                aria-label={`Retirer la ${etiquette}`}
                onClick={() => onChange(series.filter((_, j) => j !== i))}
                // Une série est le minimum : la dernière ne se retire pas.
                disabled={series.length === 1}
                className="size-7 text-(--ink-faint) opacity-0 group-hover/serie:opacity-100 focus-visible:opacity-100 hover:text-(--ink)"
              >
                <X aria-hidden="true" />
              </Button>
            </li>
          );
        })}
      </ol>

      <Button variant="ghost" size="sm" onClick={ajouter} className="mx-2 mt-1 text-(--ink-subtle)">
        <Plus aria-hidden="true" />
        Ajouter une série
      </Button>
    </div>
  );
}
