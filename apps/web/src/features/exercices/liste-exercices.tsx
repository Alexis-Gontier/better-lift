import { EtatVide } from "@/components/etats/etat-vide";
import type { ExerciceFactice } from "@/mocks/exercices";
import { BadgeRecord } from "./badge-record";

type Props = {
  exercices: ExerciceFactice[];
  q: string;
  idSelectionne?: string;
  onRecherche: (v: string) => void;
  onSelection: (id: string) => void;
};

export function ListeExercices({ exercices, q, idSelectionne, onRecherche, onSelection }: Props) {
  return (
    <section className="flex h-full flex-col">
      <header className="border-b border-(--line) px-5 pb-3 pt-4">
        <div className="mb-3.5 flex items-baseline gap-2.5">
          <h1 className="text-lg font-semibold tracking-tight">Exercices</h1>
          <span className="font-mono text-xs text-(--ink-subtle)">{exercices.length}</span>
        </div>
        <label htmlFor="recherche-exercice" className="sr-only">
          Rechercher un exercice
        </label>
        <input
          id="recherche-exercice"
          type="search"
          value={q}
          onChange={(e) => onRecherche(e.target.value)}
          placeholder="Rechercher un exercice…"
          className="w-full rounded-md border border-(--line) bg-(--surface-1) px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-(--focus-ring)"
        />
      </header>

      {/* Le cas vide est le plus facile à oublier, et le premier que l'on
          rencontre en tapant n'importe quoi dans la recherche. */}
      {exercices.length === 0 ? (
        <EtatVide
          titre="Aucun exercice trouvé"
          message={`Rien ne correspond à « ${q} ». Essaie un autre terme, ou retire les filtres.`}
        />
      ) : (
        <ul className="flex-1 overflow-auto">
          {exercices.map((ex) => (
            <li key={ex.id}>
              <button
                type="button"
                onClick={() => onSelection(ex.id)}
                aria-current={ex.id === idSelectionne ? "true" : undefined}
                className={`flex h-[54px] w-full items-center gap-3 border-b border-(--line) px-5 text-left ${
                  ex.id === idSelectionne ? "bg-(--surface-3)" : "hover:bg-(--surface-2)"
                }`}
              >
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm text-(--ink)">{ex.nom}</span>
                  <span className="mt-0.5 block text-[11.5px] text-(--ink-faint)">
                    {ex.groupe} · {ex.equipement}
                  </span>
                </span>
                {ex.record ? <BadgeRecord kg={ex.record.kg} reps={ex.record.reps} /> : null}
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
