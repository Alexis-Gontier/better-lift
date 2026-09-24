import {
  type ExerciceDetail,
  formaterCharge,
  formatJour,
  LIBELLE_GROUPE,
  LIBELLE_RECORD,
  type RecordExercice,
} from "@better-lift/shared";
import { FUSEAU } from "@/lib/fuseau";
import { SYSTEME_UNITES } from "@/lib/unites";
import { AnimationExercice } from "./animation-exercice";
import { BadgeRecord, formaterSerie } from "./badge-record";

export function DetailExercice({
  exercice,
  records,
  onFermer,
}: {
  exercice: ExerciceDetail;
  /** `undefined` : en chargement ; `null` : en échec. */
  records: RecordExercice[] | null | undefined;
  onFermer: () => void;
}) {
  return (
    <div className="flex h-full flex-col">
      <div className="flex items-start gap-2.5 border-b border-(--line) px-5 py-4">
        <div className="min-w-0 flex-1">
          <h2 className="text-base font-semibold tracking-tight">{exercice.nom}</h2>
          <p className="mt-0.5 text-xs text-(--ink-faint)">{exercice.nomAnglais}</p>
          <p className="mt-1 text-xs text-(--ink-subtle)">
            {LIBELLE_GROUPE[exercice.groupe]} · {exercice.equipement}
          </p>
        </div>
        <button
          type="button"
          onClick={onFermer}
          aria-label="Fermer le panneau de détail"
          className="grid size-7 shrink-0 place-items-center rounded-md border border-(--line) text-(--ink-subtle) hover:text-(--ink) focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--focus-ring)"
        >
          <svg
            width="13"
            height="13"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            aria-hidden="true"
          >
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div className="flex flex-col gap-4 overflow-auto px-5 py-4">
        <AnimationExercice
          key={exercice.gif ?? exercice.slug}
          gif={exercice.gif}
          nom={exercice.nom}
        />

        {/* L'aplat face au contour, visibles en même temps : c'est exactement le
            cas à éprouver pour D28. */}
        <button
          type="button"
          className="w-full rounded-md bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--focus-ring)"
        >
          Démarrer la séance
        </button>

        <div>
          <p className="mb-2 text-[11px] uppercase tracking-wide text-(--ink-subtle)">Muscles</p>
          <p className="text-sm text-(--ink)">
            {exercice.cible}
            {exercice.secondaires.length > 0 ? (
              <span className="text-(--ink-faint)"> · {exercice.secondaires.join(", ")}</span>
            ) : null}
          </p>
        </div>

        <div>
          <p className="mb-2 text-[11px] uppercase tracking-wide text-(--ink-subtle)">Exécution</p>
          <ol className="flex flex-col gap-2">
            {exercice.instructions.map((etape, i) => (
              <li key={etape} className="flex gap-2.5 text-sm leading-relaxed text-(--ink)">
                <span className="shrink-0 font-mono text-xs text-(--ink-faint)">{i + 1}</span>
                <span>{etape}</span>
              </li>
            ))}
          </ol>
        </div>

        <div>
          <p className="mb-2 text-[11px] uppercase tracking-wide text-(--ink-subtle)">Records</p>
          {records === undefined ? (
            <p className="text-sm text-(--ink-faint)">Chargement…</p>
          ) : records === null ? (
            <p className="text-sm text-(--ink-faint)">Les records n'ont pas pu être chargés.</p>
          ) : records.length === 0 ? (
            <p className="text-sm text-(--ink-faint)">
              Aucun record pour l'instant — il apparaîtra après ta première séance.
            </p>
          ) : (
            <ul className="flex flex-col gap-1.5">
              {records.map((r) => (
                <li key={r.type} className="flex items-center gap-3 text-sm">
                  <span className="w-24 shrink-0 text-(--ink-subtle)">
                    {LIBELLE_RECORD[r.type]}
                  </span>
                  <span className="flex-1">
                    {/* Le record est un CONTOUR (D28) : lime en texte sur fond teinté. */}
                    <BadgeRecord
                      libelle={
                        // 1RM et volume sont des valeurs DÉRIVÉES : on montre aussi
                        // la série qui les a donnés.
                        r.type === "UN_RM" || r.type === "VOLUME"
                          ? `${formaterCharge(r.valeur, SYSTEME_UNITES)} (${formaterSerie(r.chargeKg, r.reps)})`
                          : formaterSerie(r.chargeKg, r.reps)
                      }
                    />
                  </span>
                  <span className="shrink-0 text-[11.5px] text-(--ink-faint)">
                    {formatJour(r.date, FUSEAU)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
