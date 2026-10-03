import { formaterCharge, formatJour, LIBELLE_RECORD, type SeanceDetail } from "@better-lift/shared";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table";
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

      <ScrollArea className="min-h-0 flex-1">
        <div className="flex flex-col gap-3 px-5 py-4">
          {seance.exercices.map((ex, iE) => (
            <Card
              key={`${ex.slug}-${iE}`}
              className="gap-0 overflow-hidden bg-(--surface-2) py-0 shadow-none"
            >
              <div className="border-b border-(--line) px-3 py-2">
                <p className="text-sm font-medium text-(--ink)">{ex.nom}</p>
                {/* La note prise en séance (D90). */}
                {ex.note ? (
                  <p className="mt-0.5 text-xs whitespace-pre-line text-(--ink-muted)">{ex.note}</p>
                ) : null}
              </div>
              <Table>
                <TableBody>
                  {ex.series.map((serie, i) => (
                    <TableRow
                      key={`${ex.slug}-${iE}-${i}`}
                      // Une série non faite reste visible — c'était prévu, pas fait —
                      // mais s'efface derrière celles qui comptent.
                      className={`border-(--line) hover:bg-transparent ${serie.faite ? "" : "opacity-45"}`}
                    >
                      <TableCell className="w-8 py-2 font-mono text-xs text-(--ink-faint)">
                        {i + 1}
                      </TableCell>
                      <TableCell className="py-2 font-mono text-sm text-(--ink-muted)">
                        {formaterSerie(serie.chargeKg, serie.reps)}
                        {serie.type === "ECHAUFFEMENT" ? (
                          <span className="ml-2 font-sans text-[11px] text-(--ink-faint)">
                            échauffement
                          </span>
                        ) : null}
                      </TableCell>
                      <TableCell className="py-2 text-right">
                        {serie.records.length > 0 ? (
                          <BadgeRecord
                            libelle={serie.records.map((r) => LIBELLE_RECORD[r]).join(" · ")}
                          />
                        ) : null}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
