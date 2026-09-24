import type { RoutineResume } from "@better-lift/shared";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";

type Props = {
  routines: RoutineResume[];
  idSelectionne?: string;
  onSelection: (id: string) => void;
  onCreer: () => void;
};

const pluriel = (n: number, mot: string) => `${n} ${mot}${n > 1 ? "s" : ""}`;

/**
 * La colonne de sélection : une action en tête, puis une carte par routine.
 * La carte choisie se cerne en encre — une position, pas une action : le lime
 * reste à l'aplat du bouton.
 */
export function ListeRoutines({ routines, idSelectionne, onSelection, onCreer }: Props) {
  return (
    <section aria-label="Routines" className="flex h-full flex-col">
      <div className="p-3">
        <Button onClick={onCreer} className="w-full font-semibold">
          <Plus aria-hidden="true" />
          Nouvelle routine
        </Button>
      </div>

      {/* Un compte neuf n'a aucune routine : ce n'est pas un cas exotique, c'est
          le tout premier écran que l'on verra. */}
      {routines.length === 0 ? (
        <p className="px-4 py-6 text-center text-sm text-(--ink-subtle)">
          Aucune routine pour l'instant. Une routine est un modèle de séance : ses exercices et
          leurs séries cibles.
        </p>
      ) : (
        <ScrollArea className="min-h-0 flex-1">
          <p className="px-4 pt-1 pb-2 font-mono text-[11px] tracking-wide text-(--ink-faint) uppercase">
            {pluriel(routines.length, "routine")}
          </p>
          <ul className="flex flex-col gap-2 px-3 pb-3">
            {routines.map((r) => {
              const choisie = r.id === idSelectionne;
              return (
                <li key={r.id}>
                  <button
                    type="button"
                    onClick={() => onSelection(r.id)}
                    aria-current={choisie ? "true" : undefined}
                    className={`w-full rounded-lg border px-3 py-2.5 text-left transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--focus-ring) ${
                      choisie
                        ? "border-(--ink) bg-(--surface-2)"
                        : "border-(--line) hover:border-(--line-strong) hover:bg-(--surface-2)"
                    }`}
                  >
                    <span className="block truncate text-sm font-semibold text-(--ink)">
                      {r.nom}
                    </span>
                    <span className="mt-0.5 block font-mono text-[11.5px] text-(--ink-faint)">
                      {pluriel(r.nbExercices, "exercice")} · {pluriel(r.nbSeries, "série")}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </ScrollArea>
      )}
    </section>
  );
}
