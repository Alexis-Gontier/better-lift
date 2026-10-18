import { Skeleton } from "@/components/ui/skeleton";
import { inPeriod, type Period, periodStart, previousRange } from "@/mocks/progress";
import { TODAY } from "@/mocks/today";
import { INSIGHTS, useRecordEvents } from "./insights";
import { Palmares } from "./palmares";
import {
  ChronologyCard,
  MuscleRecordsCard,
  ReachCard,
  StalledCard,
  WeeklyRecordsCard,
} from "./records-charts";

/**
 * Records, en graphiques (D284) : les records par semaine et par muscle, ce qui est à portée et ce
 * qui stagne en jauges et en barres, le palmarès en cartes à courbe, puis la chronologie en nuage.
 */
export function RecordsView({ period }: { period: Period }) {
  const events = useRecordEvents();
  const current = inPeriod(events, period, TODAY);
  const before = previousRange(period, TODAY);
  const previous =
    period === "tout"
      ? null
      : events.filter((e) => e.date >= before.from && e.date <= before.to).length;
  // « Tout » part du premier record, pas de dix ans en arrière.
  const from = period === "tout" ? (events.at(-1)?.date ?? TODAY) : periodStart(period, TODAY);
  return (
    <>
      <div className="grid items-stretch gap-4 @4xl:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        <WeeklyRecordsCard events={current} from={from} previous={previous} />
        <MuscleRecordsCard events={current} />
      </div>
      <div className="grid items-start gap-4 @4xl:grid-cols-2">
        <ReachCard insights={INSIGHTS} />
        <StalledCard insights={INSIGHTS} />
      </div>
      <Palmares period={period} />
      <ChronologyCard events={current} from={from} />
    </>
  );
}

export function RecordsSkeleton() {
  return (
    <>
      <div className="grid gap-4 @4xl:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        <Skeleton className="h-80 rounded-xl" />
        <Skeleton className="h-80 rounded-xl" />
      </div>
      <div className="grid gap-4 @4xl:grid-cols-2">
        <Skeleton className="h-72 rounded-xl" />
        <Skeleton className="h-72 rounded-xl" />
      </div>
      <div className="grid gap-3 @xl:grid-cols-2 @4xl:grid-cols-3">
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <Skeleton key={i} className="h-44 rounded-xl" />
        ))}
      </div>
    </>
  );
}
