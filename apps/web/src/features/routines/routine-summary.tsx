import { formaterCharge, formatJour } from "@better-lift/shared";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { TIME_ZONE } from "@/lib/time-zone";
import { UNIT_SYSTEM } from "@/lib/units";
import { routineSummaryOptions } from "./queries";

/**
 * Le résumé d'une routine enregistrée (D213) : quatre tuiles jointives, ou une ligne qui dit
 * qu'elle n'a pas encore été faite. Un échec reste discret : l'éditeur doit rester utilisable.
 */
export function RoutineSummary({ id }: { id: string }) {
  const summary = useQuery(routineSummaryOptions(id));
  if (summary.isPending) return <Skeleton className="h-[74px] w-full" />;
  if (summary.isError) {
    return <p className="text-sm text-muted-foreground">{summary.error.message}</p>;
  }
  const b = summary.data;
  if (!b) {
    return (
      <p className="rounded-base border-2 border-dashed border-border px-4 py-3 text-sm text-muted-foreground">
        Pas encore faite : le résumé apparaîtra après ta première séance avec elle.
      </p>
    );
  }
  return (
    // Des tuiles JOINTIVES, comme les chiffres d'une séance : un seul bloc, filets d'encre.
    <dl className="grid grid-cols-2 overflow-hidden rounded-base border-2 border-border bg-secondary-background shadow-shadow sm:grid-cols-4">
      <Tile label="Séances" value={String(b.seances)} />
      <Tile label="Dernière" value={formatJour(b.derniere, TIME_ZONE)} />
      <Tile label="Durée moyenne" value={`${b.dureeMoyenneMin} min`} />
      <Tile label="Volume moyen" value={formaterCharge(b.volumeMoyenKg, UNIT_SYSTEM)} last />
    </dl>
  );
}

function Tile({ label, value, last = false }: { label: string; value: string; last?: boolean }) {
  return (
    <div className={`flex min-w-0 flex-col gap-0.5 px-4 py-3 ${last ? "" : "sm:border-r-2"}`}>
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="chiffre truncate text-lg">{value}</dd>
    </div>
  );
}
