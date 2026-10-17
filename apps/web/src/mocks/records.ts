import { formatKg } from "@/lib/format";
import { exerciseBySlug } from "./exercises";
import { sessionDetail } from "./history";
import { mockSessions } from "./sessions";

export type MockRecord = {
  id: string;
  exercise: string;
  slug: string;
  kind: string;
  value: string;
  date: string;
};

/** Les records battus, dérivés des séances réelles, le plus récent d'abord. */
export const mockRecords: MockRecord[] = mockSessions.flatMap((session) =>
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
