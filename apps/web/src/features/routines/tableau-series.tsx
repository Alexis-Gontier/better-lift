import { LIBELLE_TYPE_SERIE, TYPES_SERIE, type TypeSerie } from "@better-lift/shared";
import { Plus, X } from "lucide-react";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { SYSTEME_UNITES } from "@/lib/unites";
import { chargeInvalide, repsInvalides, type SerieBrouillon } from "./brouillon";

const UNITE = SYSTEME_UNITES === "imperial" ? "lb" : "kg";

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
      <Table className="text-xs">
        <TableHeader>
          <TableRow className="border-0 hover:bg-transparent">
            <TableHead className="h-7 w-6 px-1 text-[10.5px] uppercase text-(--ink-faint)">
              #
            </TableHead>
            <TableHead className="h-7 w-36 px-1 text-[10.5px] uppercase text-(--ink-faint)">
              Type
            </TableHead>
            <TableHead className="h-7 px-1 text-[10.5px] uppercase text-(--ink-faint)">
              Reps
            </TableHead>
            <TableHead className="h-7 px-1 text-[10.5px] uppercase text-(--ink-faint)">
              Charge ({UNITE})
            </TableHead>
            <TableHead className="h-7 w-8 px-1" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {series.map((s, i) => {
            const etiquette = `${nomExercice}, série ${i + 1}`;
            return (
              // Les séries n'ont pas d'identité propre : leur rang en tient lieu.
              <TableRow key={i} className="border-0 hover:bg-transparent">
                <TableCell className="px-1 py-1 font-mono text-(--ink-faint)">{i + 1}</TableCell>
                <TableCell className="px-1 py-1">
                  <Select
                    value={s.type}
                    onValueChange={(v) => modifier(i, { type: v as TypeSerie })}
                  >
                    <SelectTrigger aria-label={`${etiquette} : type`} size="sm" className="w-full">
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
                </TableCell>
                <TableCell className="px-1 py-1">
                  {/* Une saisie illisible se voit : `aria-invalid` porte la bordure du
                      danger, et l'enregistrement se bloque. */}
                  <Input
                    aria-label={`${etiquette} : répétitions`}
                    inputMode="numeric"
                    placeholder="—"
                    value={s.reps}
                    onChange={(e) => modifier(i, { reps: e.target.value })}
                    aria-invalid={repsInvalides(s.reps) || undefined}
                    className="h-8 font-mono text-xs"
                  />
                </TableCell>
                <TableCell className="px-1 py-1">
                  <Input
                    aria-label={`${etiquette} : charge en ${UNITE}`}
                    inputMode="decimal"
                    placeholder="—"
                    value={s.charge}
                    onChange={(e) => modifier(i, { charge: e.target.value })}
                    aria-invalid={chargeInvalide(s.charge) || undefined}
                    className="h-8 font-mono text-xs"
                  />
                </TableCell>
                <TableCell className="px-1 py-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label={`Retirer la ${etiquette}`}
                    onClick={() => onChange(series.filter((_, j) => j !== i))}
                    className="size-7 text-(--ink-faint) hover:text-(--ink)"
                  >
                    <X aria-hidden="true" />
                  </Button>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
      <div className="mt-1 flex items-center justify-between">
        <Button variant="ghost" size="sm" onClick={ajouter} className="text-(--ink-subtle)">
          <Plus aria-hidden="true" />
          Série
        </Button>
        {repos}
      </div>
    </div>
  );
}
