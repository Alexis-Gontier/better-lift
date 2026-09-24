import {
  ABREGE_TYPE_SERIE,
  formaterCharge,
  LIBELLE_TYPE_SERIE,
  type RoutineDetail,
} from "@better-lift/shared";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { SYSTEME_UNITES } from "@/lib/unites";
import { BoutonFermer } from "./bouton-fermer";

/** « 90 s », « 2 min », « 2 min 30 » : ce qu'on lit d'un coup d'œil. */
function formaterRepos(sec: number): string {
  if (sec < 60) return `${sec} s`;
  const min = Math.floor(sec / 60);
  const reste = sec % 60;
  return reste ? `${min} min ${String(reste).padStart(2, "0")}` : `${min} min`;
}

export function DetailRoutine({
  routine,
  onModifier,
  onFermer,
}: {
  routine: RoutineDetail;
  onModifier: () => void;
  onFermer: () => void;
}) {
  return (
    <div className="flex h-full flex-col">
      <div className="flex items-start gap-2.5 border-b border-(--line) px-5 py-4">
        <h2 className="min-w-0 flex-1 text-base font-semibold tracking-tight">{routine.nom}</h2>
        <BoutonFermer onFermer={onFermer} />
      </div>

      <ScrollArea className="min-h-0 flex-1">
        <div className="flex flex-col gap-4 px-5 py-4">
          <div className="flex gap-2">
            <Button size="lg" className="flex-1 font-semibold">
              Démarrer cette routine
            </Button>
            <Button size="lg" variant="outline" onClick={onModifier}>
              Modifier
            </Button>
          </div>

          <ol className="flex flex-col gap-3">
            {routine.exercices.map((ex, i) => (
              // L'index entre dans la clé : le même exercice peut figurer deux fois.
              <li key={`${ex.slug}-${i}`}>
                <Card className="gap-0 overflow-hidden bg-(--surface-2) py-0 shadow-none">
                  <div className="flex items-baseline gap-2 border-b border-(--line) px-3 py-2">
                    <span className="min-w-0 flex-1 truncate text-sm font-medium text-(--ink)">
                      {ex.nom}
                    </span>
                    {ex.reposSec ? (
                      <span className="shrink-0 text-[11px] text-(--ink-faint)">
                        Repos {formaterRepos(ex.reposSec)}
                      </span>
                    ) : null}
                  </div>
                  <Table className="font-mono text-xs">
                    <TableHeader>
                      <TableRow className="hover:bg-transparent">
                        <TableHead className="h-7 w-10 text-(--ink-faint)">Série</TableHead>
                        <TableHead className="h-7 w-12 text-(--ink-faint)">Type</TableHead>
                        <TableHead className="h-7 text-(--ink-faint)">Reps</TableHead>
                        <TableHead className="h-7 text-(--ink-faint)">Charge</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {ex.series.map((serie, j) => (
                        // Les séries n'ont pas d'identité propre : leur rang en tient lieu.
                        <TableRow key={j} className="border-(--line) hover:bg-transparent">
                          <TableCell className="py-1.5 text-(--ink-faint)">{j + 1}</TableCell>
                          <TableCell
                            className="py-1.5 text-(--ink-subtle)"
                            title={LIBELLE_TYPE_SERIE[serie.type]}
                          >
                            {ABREGE_TYPE_SERIE[serie.type]}
                          </TableCell>
                          <TableCell className="py-1.5 text-(--ink)">
                            {serie.repsCible === null ? "—" : serie.repsCible}
                          </TableCell>
                          <TableCell className="py-1.5 text-(--ink)">
                            {serie.chargeCibleKg === null
                              ? "—"
                              : formaterCharge(serie.chargeCibleKg, SYSTEME_UNITES)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </Card>
              </li>
            ))}
          </ol>
        </div>
      </ScrollArea>
    </div>
  );
}
