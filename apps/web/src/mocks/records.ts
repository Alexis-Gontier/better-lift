import { formatKg } from "@/lib/format";
import { exerciseBySlug } from "./exercises";
import { sessionDetail } from "./history";
import { mockSessions } from "./sessions";
import { addDays } from "./stats";
import { TODAY } from "./today";

export type MockRecord = {
  id: string;
  exercise: string;
  slug: string;
  kind: string;
  value: string;
  date: string;
};

/** Les records battus ces 30 derniers jours, dérivés des séances, le plus récent d'abord. */
export const mockRecords: MockRecord[] = mockSessions
  .filter((session) => session.date > addDays(TODAY, -30))
  .flatMap((session) =>
    sessionDetail(session).exercises.flatMap((e) =>
      e.sets
        .filter((s) => s.record && s.kg !== null)
        .map((s) => ({
          id: `${session.id}-${e.slug}`,
          exercise: exerciseBySlug(e.slug)?.name ?? e.slug,
          slug: e.slug,
          kind: "1RM estimé",
          value: `${formatKg(s.kg ?? 0)} × ${s.reps}`,
          date: session.date,
        })),
    ),
  );
