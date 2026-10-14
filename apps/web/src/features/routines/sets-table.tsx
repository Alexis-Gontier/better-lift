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
import { UNIT_SYSTEM } from "@/lib/units";

const UNIT = UNIT_SYSTEM === "imperial" ? "lb" : "kg";

/** Les colonnes : rang, type, charge, reps, retrait. Serrées : kg et reps suivent le type. */
const COLUMNS = "grid grid-cols-[2.5rem_10rem_5.5rem_5.5rem_2rem] items-center gap-2 px-4";

/** Une case de saisie : chiffres centrés, dans une boîte nette. */
const CELL = "h-9 w-full text-center text-sm tabular-nums";

export function SetsTable({
  exerciseName,
  series: sets,
  onChange,
}: {
  exerciseName: string;
  series: SerieBrouillon[];
  onChange: (sets: SerieBrouillon[]) => void;
}) {
  const update = (i: number, patch: Partial<SerieBrouillon>) =>
    onChange(sets.map((s, j) => (j === i ? { ...s, ...patch } : s)));

  // « + série » recopie la dernière : on ajoute presque toujours la même.
  const add = () => {
    const last = sets.at(-1);
    onChange([...sets, last ? { ...last } : { type: "NORMALE", reps: "", charge: "" }]);
  };

  const labels = etiquettesSeries(sets.map((s) => s.type));

  return (
    <div className="pb-2">
      {/* Une grille plutôt qu'un tableau : chaque ligne est un formulaire, et la
          colonne de retrait n'apparaît qu'au survol de sa ligne. */}
      <div
        aria-hidden="true"
        className={`${COLUMNS} border-b-2 border-border bg-muted/40 py-2 text-xs font-bold text-muted-foreground`}
      >
        <span>Série</span>
        <span>Type</span>
        <span className="text-center">{UNIT}</span>
        <span className="text-center">Reps</span>
        <span />
      </div>

      <ol>
        {sets.map((s, i) => {
          const label = `${exerciseName}, série ${i + 1}`;
          return (
            <li
              // Les séries n'ont pas d'identité propre : leur rang en tient lieu.
              key={i}
              className={`group/serie ${COLUMNS} border-b border-border/15 py-1.5 last:border-b-0`}
            >
              <span
                className={`text-sm font-semibold ${
                  s.type === "ECHAUFFEMENT" ? "text-muted-foreground" : "text-foreground"
                }`}
              >
                {labels[i]}
              </span>
              <Select value={s.type} onValueChange={(v) => update(i, { type: v as TypeSerie })}>
                <SelectTrigger
                  aria-label={`${label} : type`}
                  size="sm"
                  className="w-fit border-transparent bg-transparent px-2 text-muted-foreground shadow-none hover:border-border"
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
                aria-label={`${label} : charge en ${UNIT}`}
                inputMode="decimal"
                placeholder="—"
                value={s.charge}
                onChange={(e) => update(i, { charge: e.target.value })}
                aria-invalid={chargeInvalide(s.charge, UNIT_SYSTEM) || undefined}
                className={CELL}
              />
              <Input
                aria-label={`${label} : répétitions`}
                inputMode="numeric"
                placeholder="—"
                value={s.reps}
                onChange={(e) => update(i, { reps: e.target.value })}
                aria-invalid={repsInvalides(s.reps) || undefined}
                className={CELL}
              />
              <Button
                variant="ghost"
                size="icon"
                aria-label={`Retirer la ${label}`}
                onClick={() => onChange(sets.filter((_, j) => j !== i))}
                // Une série est le minimum : la dernière ne se retire pas.
                disabled={sets.length === 1}
                className="size-7 text-muted-foreground opacity-0 group-hover/serie:opacity-100 focus-visible:opacity-100 hover:text-foreground"
              >
                <X aria-hidden="true" />
              </Button>
            </li>
          );
        })}
      </ol>

      <Button variant="ghost" size="sm" onClick={add} className="mx-2 mt-1 text-muted-foreground">
        <Plus aria-hidden="true" />
        Ajouter une série
      </Button>
    </div>
  );
}
