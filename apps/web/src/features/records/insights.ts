import { exerciseHistory } from "@/mocks/exercise-history";
import { best1rmOf, type Performance } from "@/mocks/exercise-stats";
import { mockExercises } from "@/mocks/exercises";
import { sessionDetail } from "@/mocks/history";
import {
  isStalled,
  type Reach,
  type RecordEvent,
  recentTrend,
  recordDates,
  recordEvents,
  type Trend,
  withinReach,
} from "@/mocks/record-insights";
import { useSessions } from "@/mocks/session-store";
import { TODAY } from "@/mocks/today";

export type Insight = {
  slug: string;
  name: string;
  muscle: string;
  history: Performance[];
  best1rm: number;
  reach: Reach | null;
  trend: Trend | null;
  stalled: boolean;
  lastRecord: string | null;
};

/** Ce qu'on sait de chaque exercice déjà fait : calculé une fois, les séances factices sont figées. */
export const INSIGHTS: Insight[] = mockExercises.flatMap((e) => {
  const history = exerciseHistory(e.slug);
  if (history.length === 0) return [];
  return [
    {
      slug: e.slug,
      name: e.name,
      muscle: e.muscle,
      history,
      best1rm: Math.max(...history.map(best1rmOf)),
      reach: withinReach(history, TODAY),
      trend: recentTrend(history, TODAY),
      stalled: isStalled(history, TODAY),
      lastRecord: recordDates(history).at(-1) ?? null,
    },
  ];
});

export const insightOf = (slug: string) => INSIGHTS.find((i) => i.slug === slug);

/** Les épinglés d'abord, dans leur ordre ; les autres gardent le leur. */
export function pinnedFirst<T extends { slug: string }>(items: T[], pins: readonly string[]): T[] {
  const rank = (slug: string) => {
    const i = pins.indexOf(slug);
    return i === -1 ? pins.length : i;
  };
  return [...items].sort((a, b) => rank(a.slug) - rank(b.slug));
}

/** Tous les records battus, le plus récent d'abord. */
export function useRecordEvents(): RecordEvent[] {
  return recordEvents(useSessions().map(sessionDetail));
}
