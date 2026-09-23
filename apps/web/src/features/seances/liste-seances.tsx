import { formatJour } from "@better-lift/shared";
import { EtatVide } from "@/components/etats/etat-vide";
import type { SeanceFactice } from "@/mocks/seances";

// En dur tant qu'il n'y a pas de profil : au lot 7, le fuseau viendra des
// préférences du compte. Ce qui compte dès maintenant, c'est que le découpage
// passe par lui et jamais par l'horodatage brut.
const FUSEAU = "Europe/Paris";

type Props = {
  seances: SeanceFactice[];
  idSelectionne?: string;
  onSelection: (id: string) => void;
};

export function ListeSeances({ seances, idSelectionne, onSelection }: Props) {
  const antechronologiques = [...seances].sort(
    (a, b) => new Date(b.debutIso).getTime() - new Date(a.debutIso).getTime(),
  );

  return (
    <section className="flex h-full flex-col">
      <header className="flex items-baseline gap-2.5 border-b border-(--line) px-5 pb-3.5 pt-4">
        <h1 className="text-lg font-semibold tracking-tight">Séances</h1>
        <span className="font-mono text-xs text-(--ink-subtle)">{seances.length}</span>
      </header>

      {antechronologiques.length === 0 ? (
        <EtatVide
          titre="Aucune séance"
          message="Ton historique se remplira au fil de tes entraînements. Démarre une séance depuis une routine ou à vide."
        />
      ) : (
        <ul className="flex-1 overflow-auto">
          {antechronologiques.map((s) => (
            <li key={s.id}>
              <button
                type="button"
                onClick={() => onSelection(s.id)}
                aria-current={s.id === idSelectionne ? "true" : undefined}
                className={`flex h-[62px] w-full items-center gap-3 border-b border-(--line) px-5 text-left ${
                  s.id === idSelectionne ? "bg-(--surface-3)" : "hover:bg-(--surface-2)"
                }`}
              >
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm text-(--ink)">{s.titre}</span>
                  <span className="mt-0.5 block text-[11.5px] text-(--ink-faint)">
                    {formatJour(s.debutIso, FUSEAU)}
                  </span>
                </span>
                <span className="shrink-0 font-mono text-xs text-(--ink-subtle)">
                  {s.dureeMin} min · {(s.volumeKg / 1000).toFixed(1).replace(".", ",")} t
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
