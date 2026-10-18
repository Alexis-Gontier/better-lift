import { describe, expect, it } from "vitest";
import type { SessionDetail } from "@/mocks/history";
import { changedExercises, sessionChangeCount } from "./session-draft";

const saved: SessionDetail = {
  session: { id: "s1", date: "2026-10-13", routine: "Push", minutes: 47, volume: 0, records: 0 },
  exercises: [
    { slug: "a", restSeconds: 90, sets: [{ kg: 20, reps: 10, record: true }] },
    { slug: "b", restSeconds: 90, sets: [{ kg: null, reps: 12 }] },
  ],
};

describe("correction d'une séance", () => {
  it("ne compte rien sur une séance intacte", () => {
    expect(sessionChangeCount(saved, saved)).toBe(0);
  });

  it("compte un exercice touché, la durée et la note", () => {
    const [a, b] = saved.exercises;
    if (!a || !b) throw new Error("fixture");
    const draft: SessionDetail = {
      ...saved,
      session: { ...saved.session, minutes: 50 },
      notes: "Genou sensible",
      exercises: [a, { ...b, sets: [{ kg: 10, reps: 12 }] }],
    };
    expect([...changedExercises(draft, saved)]).toEqual([1]);
    expect(sessionChangeCount(draft, saved)).toBe(3);
  });

  it("ignore une note faite d'espaces", () => {
    expect(sessionChangeCount({ ...saved, notes: "  " }, saved)).toBe(0);
  });
});
