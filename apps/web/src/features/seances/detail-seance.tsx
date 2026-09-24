import { formaterCharge, formatJour, LIBELLE_RECORD, type SeanceDetail } from "@better-lift/shared";
import { BadgeRecord, formaterSerie } from "@/features/exercices/badge-record";
import { BoutonFermer } from "@/features/routines/bouton-fermer";
import { FUSEAU } from "@/lib/fuseau";
import { SYSTEME_UNITES } from "@/lib/unites";
import { dureeMin } from "./liste-seances";

export function DetailSeance({ seance, onFermer }: { seance: SeanceDetail; onFermer: () => void }) {
  return (
    <div className="flex h-full flex-col">
      <div className="flex items-start gap-2.5 border-b border-(--line) px-5 py-4">
        <div className="min-w-0 flex-1">
          <h2 className="text-base font-semibold tracking-tight">{seance.nom}</h2>
          <p className="mt-1 text-xs text-(--ink-subtle)">
            {formatJour(seance.debut, FUSEAU)} · {dureeMin(seance)} min · {seance.seriesFaites}{" "}
            {seance.seriesFaites > 1 ? "séries" : "série"} ·{" "}
            {formaterCharge(seance.volumeKg, SYSTEME_UNITES)}
          </p>
        </div>
        <BoutonFermer onFermer={onFermer} />
      </div>

      <div className="flex flex-col gap-5 overflow-auto px-5 py-4">
        {seance.exercices.map((ex, iE) => (
          <div key={`${ex.slug}-${iE}`}>
            <p className="mb-2 text-sm font-medium text-(--ink)">{ex.nom}</p>
            <ul className="flex flex-col gap-1">
              {ex.series.map((serie, i) => (
                <li
                  key={`${ex.slug}-${iE}-${i}`}
                  // Une série non faite reste visible — c'était prévu, pas fait —
                  // mais s'efface derrière celles qui comptent.
                  className={`flex flex-wrap items-center gap-x-3 gap-y-1 rounded-md bg-(--surface-2) px-3 py-2 ${
                    serie.faite ? "" : "opacity-45"
                  }`}
                >
                  <span className="w-5 shrink-0 font-mono text-xs text-(--ink-faint)">{i + 1}</span>
                  <span className="flex-1 font-mono text-sm text-(--ink-muted)">
                    {formaterSerie(serie.chargeKg, serie.reps)}
                    {serie.type === "ECHAUFFEMENT" ? (
                      <span className="ml-2 text-[11px] text-(--ink-faint)">échauffement</span>
                    ) : null}
                  </span>
                  {serie.records.length > 0 ? (
                    <BadgeRecord
                      libelle={serie.records.map((r) => LIBELLE_RECORD[r]).join(" · ")}
                    />
                  ) : null}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
