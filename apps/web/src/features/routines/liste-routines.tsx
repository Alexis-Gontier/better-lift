import type { RoutineResume } from "@better-lift/shared";
import { Plus } from "lucide-react";
import { EtatVide } from "@/components/etats/etat-vide";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";

type Props = {
  routines: RoutineResume[];
  idSelectionne?: string;
  onSelection: (id: string) => void;
  onCreer: () => void;
};

const pluriel = (n: number, mot: string) => `${n} ${mot}${n > 1 ? "s" : ""}`;

export function ListeRoutines({ routines, idSelectionne, onSelection, onCreer }: Props) {
  return (
    <section aria-label="Routines" className="flex h-full flex-col">
      <header className="flex items-center gap-2.5 border-b border-(--line) px-4 py-3">
        <span className="font-mono text-xs text-(--ink-subtle)">
          {pluriel(routines.length, "routine")}
        </span>
        <Button variant="outline" size="sm" onClick={onCreer} className="ml-auto">
          <Plus aria-hidden="true" />
          Nouvelle
        </Button>
      </header>

      {/* Un compte neuf n'a aucune routine : ce n'est pas un cas exotique, c'est
          le tout premier écran que l'on verra. */}
      {routines.length === 0 ? (
        <EtatVide
          titre="Aucune routine"
          message="Une routine est un modèle de séance : une liste d'exercices avec leurs séries cibles. Crées-en une pour préparer tes prochains entraînements."
          action={
            <Button onClick={onCreer} className="font-semibold">
              Créer une routine
            </Button>
          }
        />
      ) : (
        <ScrollArea className="min-h-0 flex-1">
          <ul>
            {routines.map((r) => (
              <li key={r.id}>
                <button
                  type="button"
                  onClick={() => onSelection(r.id)}
                  aria-current={r.id === idSelectionne ? "true" : undefined}
                  className={`flex h-[62px] w-full items-center gap-3 border-b border-(--line) px-4 text-left ${
                    r.id === idSelectionne ? "bg-(--surface-3)" : "hover:bg-(--surface-2)"
                  }`}
                >
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm text-(--ink)">{r.nom}</span>
                    <span className="mt-0.5 block text-[11.5px] text-(--ink-faint)">
                      {pluriel(r.nbExercices, "exercice")} · {pluriel(r.nbSeries, "série")}
                    </span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </ScrollArea>
      )}
    </section>
  );
}
