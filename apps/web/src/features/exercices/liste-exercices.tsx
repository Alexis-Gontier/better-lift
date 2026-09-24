import { type ExerciceResume, LIBELLE_GROUPE } from "@better-lift/shared";
import { EtatVide } from "@/components/etats/etat-vide";

type Props = {
  exercices: ExerciceResume[];
  /** Le total côté serveur : la liste n'en porte que les pages déjà chargées. */
  total: number;
  aSuite: boolean;
  chargeSuite: boolean;
  onSuite: () => void;
  q: string;
  slugSelectionne?: string;
  onRecherche: (v: string) => void;
  onSelection: (slug: string) => void;
};

export function ListeExercices({
  exercices,
  total,
  aSuite,
  chargeSuite,
  onSuite,
  q,
  slugSelectionne,
  onRecherche,
  onSelection,
}: Props) {
  return (
    <section className="flex h-full flex-col">
      <header className="border-b border-(--line) px-5 pb-3 pt-4">
        <div className="mb-3.5 flex items-baseline gap-2.5">
          <h1 className="text-lg font-semibold tracking-tight">Exercices</h1>
          <span className="font-mono text-xs text-(--ink-subtle)">{total}</span>
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
          message={
            q
              ? `Rien ne correspond à « ${q} ». Essaie un autre terme, ou retire les filtres.`
              : "Le catalogue est vide pour l'instant."
          }
        />
      ) : (
        <ul className="flex-1 overflow-auto">
          {exercices.map((ex) => (
            <li key={ex.slug}>
              <button
                type="button"
                onClick={() => onSelection(ex.slug)}
                aria-current={ex.slug === slugSelectionne ? "true" : undefined}
                className={`flex h-[54px] w-full items-center gap-3 border-b border-(--line) px-5 text-left ${
                  ex.slug === slugSelectionne ? "bg-(--surface-3)" : "hover:bg-(--surface-2)"
                }`}
              >
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm text-(--ink)">{ex.nom}</span>
                  <span className="mt-0.5 block text-[11.5px] text-(--ink-faint)">
                    {LIBELLE_GROUPE[ex.groupe]} · {ex.equipement}
                  </span>
                </span>
              </button>
            </li>
          ))}
          {aSuite ? (
            <li className="px-5 py-3">
              <button
                type="button"
                onClick={onSuite}
                disabled={chargeSuite}
                className="w-full rounded-md border border-(--line) py-2 text-sm text-(--ink-subtle) hover:bg-(--surface-2) hover:text-(--ink) disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--focus-ring)"
              >
                {chargeSuite ? "Chargement…" : `Afficher plus — ${exercices.length} sur ${total}`}
              </button>
            </li>
          ) : null}
        </ul>
      )}
    </section>
  );
}
