import { formaterCharge, formatJour, type SeanceResume } from "@better-lift/shared";
import { EtatVide } from "@/components/etats/etat-vide";
import { FUSEAU } from "@/lib/fuseau";
import { SYSTEME_UNITES } from "@/lib/unites";

type Props = {
  seances: SeanceResume[];
  total: number;
  aSuite: boolean;
  chargeSuite: boolean;
  onSuite: () => void;
  idSelectionne?: string;
  onSelection: (id: string) => void;
};

/** La durée en minutes, arrondie : on lit « 62 min », pas « 61,7 ». */
export const dureeMin = (s: Pick<SeanceResume, "debut" | "fin">) =>
  Math.round((Date.parse(s.fin) - Date.parse(s.debut)) / 60000);

export function ListeSeances({
  seances,
  total,
  aSuite,
  chargeSuite,
  onSuite,
  idSelectionne,
  onSelection,
}: Props) {
  return (
    <section className="flex h-full flex-col">
      <header className="flex items-baseline gap-2.5 border-b border-(--line) px-5 pb-3.5 pt-4">
        <h1 className="text-lg font-semibold tracking-tight">Séances</h1>
        <span className="font-mono text-xs text-(--ink-subtle)">{total}</span>
      </header>

      {seances.length === 0 ? (
        <EtatVide
          titre="Aucune séance"
          message="Ton historique se remplira au fil de tes entraînements. Démarre une séance sur ton téléphone, depuis une routine ou à vide."
        />
      ) : (
        // L'API rend déjà l'ordre antéchronologique : on ne retrie pas ici.
        <ul className="flex-1 overflow-auto">
          {seances.map((s) => (
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
                  <span className="block truncate text-sm text-(--ink)">{s.nom}</span>
                  <span className="mt-0.5 block text-[11.5px] text-(--ink-faint)">
                    {/* Le jour dans le fuseau de l'utilisateur, jamais en UTC (D66). */}
                    {formatJour(s.debut, FUSEAU)}
                  </span>
                </span>
                <span className="shrink-0 font-mono text-xs text-(--ink-subtle)">
                  {dureeMin(s)} min · {formaterCharge(s.volumeKg, SYSTEME_UNITES)}
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
                {chargeSuite ? "Chargement…" : `Afficher plus — ${seances.length} sur ${total}`}
              </button>
            </li>
          ) : null}
        </ul>
      )}
    </section>
  );
}
