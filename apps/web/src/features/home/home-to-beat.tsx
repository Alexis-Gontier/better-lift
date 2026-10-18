import { usePins } from "@/mocks/pins";
import { INSIGHTS, pinnedFirst } from "../records/insights";
import { ReachList, StalledList, TrendList } from "../records/lift-lists";

/** Variante C (D277) : à portée, en progression, en stagnation ; les épinglés en tête. */
export function HomeToBeat() {
  const { slugs } = usePins();
  const byTrend = [...INSIGHTS].sort((a, b) => (b.trend?.change ?? 0) - (a.trend?.change ?? 0));
  return (
    <div className="grid items-start gap-4 @4xl:grid-cols-3">
      <ReachList items={pinnedFirst(INSIGHTS, slugs)} limit={6} />
      <TrendList items={pinnedFirst(byTrend, slugs)} limit={6} />
      <StalledList items={pinnedFirst(INSIGHTS, slugs)} limit={6} />
    </div>
  );
}
