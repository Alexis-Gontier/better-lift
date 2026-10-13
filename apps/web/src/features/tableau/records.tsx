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

/** Les quatre records les plus récents de la période (D189) ; le nom ouvre la fiche. */
export function Records({ records }: { records: readonly RecordRecent[] }) {
  const affiches = records.slice(0, 4);
  return (
    <Carte
      titre="Records de la période"
      detail={records.length > 4 ? `${records.length} au total` : undefined}
      className="lg:col-span-4"
    >
      {affiches.length === 0 ? (
        <p className="py-6 text-center text-sm text-muted-foreground">
          Aucun record sur la période.
        </p>
      ) : (
        <ul className="flex flex-col">
          {affiches.map((r) => (
            <li
              key={`${r.slug}-${r.date}`}
              className="flex items-start justify-between gap-3 border-t border-border py-2.5 first:border-t-0"
            >
              <div className="min-w-0">
                <Link
                  to="/exercices/$slug"
                  params={{ slug: r.slug }}
                  className="block font-semibold hover:underline hover:underline-offset-4"
                >
                  {r.nom}
                </Link>
                <span className="text-xs text-muted-foreground">
                  {DATE.format(new Date(r.date))}
                </span>
              </div>
              <div className="flex shrink-0 flex-col items-end gap-1 text-[13.5px]">
                <span>
                  {r.chargeKg === null
                    ? `${r.reps} reps`
                    : `${formaterCharge(r.chargeKg, SYSTEME_UNITES)} × ${r.reps}`}
                </span>
                {/* Le record est un CONTOUR (CLAUDE.md). */}
                <BadgeRecord libelle={r.types.map((t) => LIBELLE_RECORD[t]).join(" · ")} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </Carte>
  );
}
