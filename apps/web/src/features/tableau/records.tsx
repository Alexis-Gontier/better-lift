import { formaterCharge, LIBELLE_RECORD, type RecordRecent } from "@better-lift/shared";
import { Link } from "@tanstack/react-router";
import { BadgeRecord } from "@/features/exercices/badge-record";
import { FUSEAU } from "@/lib/fuseau";
import { SYSTEME_UNITES } from "@/lib/unites";
import { Carte } from "./carte";

const DATE = new Intl.DateTimeFormat("fr-FR", {
  weekday: "short",
  day: "numeric",
  month: "short",
  timeZone: FUSEAU,
});

/** Les records de la période en tableau (D137) ; le nom ouvre la fiche de l'exercice. */
export function Records({ records }: { records: readonly RecordRecent[] }) {
  return (
    <Carte
      titre={`Records de la période${records.length ? ` · ${records.length}` : ""}`}
      className="lg:col-span-12"
    >
      {records.length === 0 ? (
        <p className="py-6 text-center text-sm text-(--ink-subtle)">Aucun record sur la période.</p>
      ) : (
        <table className="w-full text-[13.5px]">
          <thead>
            <tr className="text-left text-xs text-(--ink-subtle)">
              <th className="py-1.5 font-medium">Exercice</th>
              <th className="font-medium">Série</th>
              <th className="font-medium">Record</th>
              <th className="text-right font-medium">Date</th>
            </tr>
          </thead>
          <tbody>
            {records.map((r) => (
              <tr key={`${r.slug}-${r.date}`} className="border-t border-(--line)">
                <td className="py-2.5">
                  <Link
                    to="/exercices/$slug"
                    params={{ slug: r.slug }}
                    className="font-semibold hover:underline hover:underline-offset-4"
                  >
                    {r.nom}
                  </Link>
                </td>
                <td>
                  {r.chargeKg === null
                    ? `${r.reps} reps`
                    : `${formaterCharge(r.chargeKg, SYSTEME_UNITES)} × ${r.reps}`}
                </td>
                <td>
                  {/* Le record est un CONTOUR : lime en texte sur fond teinté (CLAUDE.md). */}
                  <BadgeRecord libelle={r.types.map((t) => LIBELLE_RECORD[t]).join(" · ")} />
                </td>
                <td className="text-right text-(--ink-muted)">{DATE.format(new Date(r.date))}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </Carte>
  );
}
