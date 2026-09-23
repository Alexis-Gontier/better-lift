import { EtatVide } from "@/components/etats/etat-vide";
import type { RoutineFactice } from "@/mocks/routines";

type Props = {
  routines: RoutineFactice[];
  idSelectionne?: string;
  onSelection: (id: string) => void;
};

export function ListeRoutines({ routines, idSelectionne, onSelection }: Props) {
  return (
    <section className="flex h-full flex-col">
      <header className="flex items-baseline gap-2.5 border-b border-(--line) px-5 pb-3.5 pt-4">
        <h1 className="text-lg font-semibold tracking-tight">Routines</h1>
        <span className="font-mono text-xs text-(--ink-subtle)">{routines.length}</span>
      </header>

      {/* Un compte neuf n'a aucune routine : ce n'est pas un cas exotique, c'est
          le tout premier écran que l'on verra. */}
      {routines.length === 0 ? (
        <EtatVide
          titre="Aucune routine"
          message="Une routine est un modèle de séance : une liste d'exercices avec leurs séries cibles. Crées-en une pour préparer tes prochains entraînements."
          action={
            <button
              type="button"
              className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--focus-ring)"
            >
              Créer une routine
            </button>
          }
        />
      ) : (
        <ul className="flex-1 overflow-auto">
          {routines.map((r) => {
            const totalSeries = r.exercices.reduce((n, e) => n + e.series, 0);
            return (
              <li key={r.id}>
                <button
                  type="button"
                  onClick={() => onSelection(r.id)}
                  aria-current={r.id === idSelectionne ? "true" : undefined}
                  className={`flex h-[62px] w-full items-center gap-3 border-b border-(--line) px-5 text-left ${
                    r.id === idSelectionne ? "bg-(--surface-3)" : "hover:bg-(--surface-2)"
                  }`}
                >
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm text-(--ink)">{r.nom}</span>
                    <span className="mt-0.5 block text-[11.5px] text-(--ink-faint)">
                      {r.exercices.length} exercices · {totalSeries} séries
                    </span>
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
