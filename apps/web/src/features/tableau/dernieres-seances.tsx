import { formaterCharge } from "@better-lift/shared";
import { useInfiniteQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { BadgeRecord } from "@/features/exercices/badge-record";
import { optionsSeances } from "@/features/seances/requetes";
import { FUSEAU } from "@/lib/fuseau";
import { SYSTEME_UNITES } from "@/lib/unites";
import { dureeTexte } from "./calculs";
import { Carte } from "./carte";

const DATE = new Intl.DateTimeFormat("fr-FR", {
  weekday: "short",
  day: "numeric",
  month: "short",
  timeZone: FUSEAU,
});
const minutes = (s: { debut: string; fin: string }) =>
  Math.round((Date.parse(s.fin) - Date.parse(s.debut)) / 60_000);

/**
 * Les cinq dernières séances, indépendantes de la période (D189). Sa propre requête :
 * elle charge et échoue seule, le reste de la page s'affiche.
 */
export function DernieresSeances() {
  const requete = useInfiniteQuery(optionsSeances());
  const seances = requete.data?.pages[0]?.seances.slice(0, 5) ?? [];

  return (
    <Carte
      titre="Dernières séances"
      detail={
        <Link to="/seances" className="hover:underline hover:underline-offset-4">
          Tout l'historique →
        </Link>
      }
      className="lg:col-span-5"
    >
      {requete.isPending ? (
        <div className="flex flex-col gap-2" aria-busy="true">
          {[0, 1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-9 rounded-md bg-muted" />
          ))}
        </div>
      ) : requete.isError ? (
        <div className="flex flex-col items-start gap-2 py-4 text-sm">
          <p role="alert">L'historique n'a pas pu être chargé.</p>
          <Button variant="outline" size="sm" onClick={() => void requete.refetch()}>
            Réessayer
          </Button>
        </div>
      ) : seances.length === 0 ? (
        <p className="py-6 text-center text-sm text-muted-foreground">Aucune séance.</p>
      ) : (
        <ul className="flex flex-col">
          {seances.map((s) => (
            <li key={s.id} className="border-t border-border first:border-t-0">
              <Link
                to="/seances/$id"
                params={{ id: s.id }}
                className="grid grid-cols-[1fr_auto] items-center gap-x-3 py-2.5 text-[13.5px] hover:bg-muted"
              >
                <span className="min-w-0 truncate font-semibold">{s.nom}</span>
                <span className="text-right">
                  {formaterCharge(Math.round(s.volumeKg), SYSTEME_UNITES)}
                </span>
                <span className="text-xs text-muted-foreground">
                  {DATE.format(new Date(s.debut))} · {dureeTexte(minutes(s))} · {s.seriesFaites}{" "}
                  {s.seriesFaites > 1 ? "séries" : "série"}
                </span>
                <span className="justify-self-end">
                  {s.nbRecords > 0 ? (
                    <BadgeRecord libelle={`${s.nbRecords} record${s.nbRecords > 1 ? "s" : ""}`} />
                  ) : null}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </Carte>
  );
}
