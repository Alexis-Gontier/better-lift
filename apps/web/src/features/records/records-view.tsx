import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDaysAgo, formatShortDay } from "@/lib/format";
import { inPeriod, type Period, previousRange } from "@/mocks/progress";
import { groupByWeek } from "@/mocks/record-insights";
import { daysSince } from "@/mocks/routine-stats";
import { TODAY } from "@/mocks/today";
import { INSIGHTS, useRecordEvents } from "./insights";
import { ReachList, StalledList } from "./lift-lists";
import { RecordRow } from "./record-row";
import { RecordsTable } from "./records-table";

const signed = (n: number) => (n > 0 ? `+${n}` : n < 0 ? `−${Math.abs(n)}` : "±0");

/**
 * Records (D278) : le bandeau de la période, ce qui est à portée et ce qui stagne, le palmarès
 * par exercice, puis la chronologie de tous les records, semaine par semaine.
 */
export function RecordsView({ period }: { period: Period }) {
  const events = useRecordEvents();
  const current = inPeriod(events, period, TODAY);
  const before = previousRange(period, TODAY);
  const previous = events.filter((e) => e.date >= before.from && e.date <= before.to);
  const last = events[0];
  const figures = [
    {
      label: "Records battus",
      value: String(current.length),
      hint:
        period === "tout"
          ? "depuis le début"
          : `${signed(current.length - previous.length)} vs période précédente`,
    },
    {
      label: "Exercices en progrès",
      value: String(new Set(current.map((e) => e.slug)).size),
      hint: "avec au moins un record",
    },
    {
      label: "Dernier record",
      value: last ? formatDaysAgo(daysSince(last.date, TODAY)) : "—",
      hint: last ? formatShortDay(last.date) : "aucun encore",
    },
  ];
  return (
    <>
      <Card size="sm">
        <CardContent className="grid grid-cols-1 gap-x-6 gap-y-4 @xl:grid-cols-3">
          {figures.map((f) => (
            <div key={f.label} className="flex flex-col gap-0.5">
              <span className="text-muted-foreground text-xs">{f.label}</span>
              <span className="font-semibold text-2xl tabular-nums">{f.value}</span>
              <span className="text-muted-foreground text-xs tabular-nums">{f.hint}</span>
            </div>
          ))}
        </CardContent>
      </Card>
      <div className="grid items-start gap-4 @3xl:grid-cols-2">
        <ReachList items={INSIGHTS} />
        <StalledList items={INSIGHTS} />
      </div>
      <section className="flex flex-col gap-3">
        <h2 className="font-medium text-lg">Palmarès</h2>
        <RecordsTable period={period} />
      </section>
      <Card className="gap-0 pb-0">
        <CardHeader className="pb-3">
          <CardTitle>Chronologie</CardTitle>
          <CardDescription>
            Chaque record battu sur la période ; un clic ouvre sa séance
          </CardDescription>
        </CardHeader>
        {current.length === 0 ? (
          <p className="border-t px-4 py-6 text-center text-muted-foreground text-sm">
            Aucun record sur la période.
          </p>
        ) : (
          groupByWeek(current).map((g) => (
            <div key={g.week}>
              <div className="border-t bg-muted/40 px-4 py-1.5 text-muted-foreground text-xs">
                Semaine du {formatShortDay(g.week)} · {g.items.length}
              </div>
              {g.items.map((e) => (
                <RecordRow key={e.id} event={e} />
              ))}
            </div>
          ))
        )}
      </Card>
    </>
  );
}

export function RecordsSkeleton() {
  return (
    <>
      <Skeleton className="h-24 rounded-xl" />
      <div className="grid gap-4 @3xl:grid-cols-2">
        <Skeleton className="h-64 rounded-xl" />
        <Skeleton className="h-64 rounded-xl" />
      </div>
      <Skeleton className="h-96 rounded-xl" />
    </>
  );
}
