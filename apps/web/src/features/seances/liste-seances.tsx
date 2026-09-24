import { formaterCharge, formatJour, type SeanceResume } from "@better-lift/shared";
import { EtatVide } from "@/components/etats/etat-vide";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
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
    <section aria-label="Séances" className="flex h-full flex-col">
      <header className="border-b border-(--line) px-4 py-3">
        <span className="font-mono text-xs text-(--ink-subtle)">
          {total} {total > 1 ? "séances" : "séance"}
        </span>
      </header>

      {seances.length === 0 ? (
        <EtatVide
          titre="Aucune séance"
          message="Ton historique se remplira au fil de tes entraînements. Démarre une séance sur ton téléphone, depuis une routine ou à vide."
        />
      ) : (
        // L'API rend déjà l'ordre antéchronologique : on ne retrie pas ici.
        <ScrollArea className="min-h-0 flex-1">
          <ul>
            {seances.map((s) => (
              <li key={s.id}>
                <button
                  type="button"
                  onClick={() => onSelection(s.id)}
                  aria-current={s.id === idSelectionne ? "true" : undefined}
                  className={`flex h-[62px] w-full items-center gap-3 border-b border-(--line) px-4 text-left ${
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
              <li className="px-4 py-3">
                <Button
                  variant="outline"
                  onClick={onSuite}
                  disabled={chargeSuite}
                  className="w-full text-(--ink-subtle)"
                >
                  {chargeSuite ? "Chargement…" : `Afficher plus — ${seances.length} sur ${total}`}
                </Button>
              </li>
            ) : null}
          </ul>
        </ScrollArea>
      )}
    </section>
  );
}
