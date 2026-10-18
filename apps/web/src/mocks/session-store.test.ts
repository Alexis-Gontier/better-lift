import { describe, expect, it } from "vitest";
import { currentSessions, deleteSession, withCorrection } from "./session-store";
import type { MockSession } from "./sessions";

const session: MockSession = {
  id: "s1",
  date: "2026-10-13",
  routine: "Push",
  minutes: 47,
  volume: 1600,
  records: 1,
};

describe("correction d'une séance", () => {
  it("relit le volume des séries corrigées", () => {
    const corrected = withCorrection(session, {
      minutes: 47,
      exercises: [
        {
          slug: "lever-chest-press",
          restSeconds: 150,
          sets: [
            { kg: 80, reps: 10 },
            { kg: 85, reps: 8 },
          ],
        },
      ],
    });
    expect(corrected.session.volume).toBe(80 * 10 + 85 * 8);
  });

  it("ne compte pas une charge non notée", () => {
    const corrected = withCorrection(session, {
      minutes: 47,
      exercises: [{ slug: "dips", restSeconds: 90, sets: [{ kg: null, reps: 12 }] }],
    });
    expect(corrected.session.volume).toBe(0);
  });

  it("prend la durée et la note corrigées, garde le reste", () => {
    const corrected = withCorrection(session, {
      minutes: 52,
      notes: "Épaule raide",
      exercises: [],
    });
    expect(corrected.session).toMatchObject({ id: "s1", routine: "Push", minutes: 52, records: 1 });
    expect(corrected.notes).toBe("Épaule raide");
  });

  it("n'invente pas de note vide", () => {
    expect(withCorrection(session, { minutes: 47, exercises: [] })).not.toHaveProperty("notes");
  });
});

describe("suppression d'une séance", () => {
  it("retire la séance de la liste, et l'annulation la rend à sa place", () => {
    const before = currentSessions();
    const id = before[1]?.id ?? "";
    const undo = deleteSession(id);
    expect(currentSessions().some((s) => s.id === id)).toBe(false);
    expect(currentSessions()).toHaveLength(before.length - 1);
    undo();
    expect(currentSessions().map((s) => s.id)).toEqual(before.map((s) => s.id));
  });
});
