import { type FaitSeance, LIBELLE_RECORD, type RecordSeance } from "@better-lift/shared";
import { Link } from "@tanstack/react-router";
import { Trophy } from "lucide-react";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatKg, formatLoad, formatMinutes, formatShortDay, plural } from "@/lib/format";
import { jourCivil } from "@/lib/locale";

const VIDE = (
  <p className="py-6 text-center text-muted-foreground text-sm">Aucune séance sur la période.</p>
);

function Bloc({
  titre,
  lien,
  vers,
  children,
}: {
  titre: string;
  lien: string;
  vers: "/records" | "/history";
  children: ReactNode;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{titre}</CardTitle>
        <CardAction>
          <Button asChild variant="link" size="sm" className="h-auto p-0">
            <Link to={vers}>{lien}</Link>
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

/** « 100 kg × 5 », ou « 12 rép. » au poids du corps. */
const serie = (r: RecordSeance) =>
  r.chargeKg === null ? `${r.reps ?? "—"} rép.` : `${formatLoad(r.chargeKg)} × ${r.reps ?? "—"}`;

/** Les derniers records battus sur la période (D330). */
export function RecentRecords({ records }: { records: (RecordSeance & { date: string })[] }) {
  return (
    <Bloc titre="Records récents" lien="Tous les records" vers="/records">
      {records.length === 0 ? (
        <p className="py-6 text-center text-muted-foreground text-sm">
          Aucun record battu sur la période.
        </p>
      ) : (
        <ul className="flex flex-col divide-y">
          {records.map((r, i) => (
            <li
              key={`${r.slug}-${r.date}-${i}`}
              className="flex items-center gap-3 py-2.5 first:pt-0 last:pb-0"
            >
              <Trophy className="size-4 shrink-0 text-muted-foreground" aria-hidden />
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium text-sm">{r.nom}</p>
                <p className="text-muted-foreground text-xs">
                  {r.types.map((t) => LIBELLE_RECORD[t]).join(" · ")}
                </p>
              </div>
              <div className="text-right">
                <p className="font-medium text-sm tabular-nums">{serie(r)}</p>
                <p className="text-muted-foreground text-xs">{formatShortDay(jourCivil(r.date))}</p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </Bloc>
  );
}

const minutes = (s: FaitSeance) => Math.round((Date.parse(s.fin) - Date.parse(s.debut)) / 60_000);

/** Les dernières séances (D330) ; chacune s'ouvre dans l'Historique. */
export function RecentSessions({ seances }: { seances: FaitSeance[] }) {
  return (
    <Bloc titre="Dernières séances" lien="Tout l'historique" vers="/history">
      {seances.length === 0 ? (
        VIDE
      ) : (
        <ul className="-mx-2 flex flex-col">
          {seances.map((s) => (
            <li key={s.id}>
              <Link
                to="/history/$id"
                params={{ id: s.id }}
                className="flex items-center gap-3 rounded-md px-2 py-2 hover:bg-muted"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-sm">{s.nom}</p>
                  <p className="text-muted-foreground text-xs">
                    {formatShortDay(jourCivil(s.debut))} · {formatMinutes(minutes(s))}
                  </p>
                </div>
                {s.records.length > 0 ? (
                  <span className="flex items-center gap-1 text-muted-foreground text-xs">
                    <Trophy className="size-3.5" aria-hidden />
                    {plural(s.records.length, "record")}
                  </span>
                ) : null}
                <span className="w-20 text-right text-sm tabular-nums">{formatKg(s.volumeKg)}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </Bloc>
  );
}
