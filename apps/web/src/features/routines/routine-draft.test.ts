import { describe, expect, it } from "vitest";
import type { MockRoutine } from "@/mocks/routines";
import { canSave, emptyDraft, fromDraft, isDirty, toDraft } from "./routine-draft";

const routine: MockRoutine = {
  id: "1",
  name: "Push",
  folder: "Push Pull Legs",
  lastDone: "2026-10-13",
  exercises: [
    { slug: "lever-chest-press", restSeconds: 150, sets: [{ kg: 80, reps: 10 }] },
    { slug: "dumbbell-lateral-raise", restSeconds: 90, sets: [{ kg: null, reps: 12 }] },
  ],
};

describe("brouillon de routine", () => {
  it("revient à la routine d'origine, sans identifiant technique", () => {
    expect(fromDraft(toDraft(routine), routine)).toEqual(routine);
  });

  it("n'est pas modifié tant qu'on n'a rien changé", () => {
    expect(isDirty(toDraft(routine), routine)).toBe(false);
    expect(isDirty(emptyDraft, undefined)).toBe(false);
  });

  it("est modifié dès qu'une série change", () => {
    const draft = toDraft(routine);
    const [first, ...rest] = draft.exercises;
    if (!first) throw new Error("exercice attendu");
    const changed = {
      ...draft,
      exercises: [{ ...first, sets: [{ kg: 82.5, reps: 10 }] }, ...rest],
    };
    expect(isDirty(changed, routine)).toBe(true);
  });

  it("ne compte pas les espaces autour du nom", () => {
    expect(isDirty({ ...toDraft(routine), name: " Push " }, routine)).toBe(false);
  });

  it("ne voit pas un simple renumérotage des identifiants", () => {
    const draft = toDraft(routine);
    const renumbered = {
      ...draft,
      exercises: draft.exercises.map((e) => ({ ...e, uid: `x${e.uid}` })),
    };
    expect(isDirty(renumbered, routine)).toBe(false);
  });

  it("voit un réordonnancement", () => {
    const draft = toDraft(routine);
    expect(isDirty({ ...draft, exercises: [...draft.exercises].reverse() }, routine)).toBe(true);
  });

  it("exige un nom et un exercice pour enregistrer", () => {
    expect(canSave(emptyDraft)).toBe(false);
    expect(canSave({ ...toDraft(routine), name: "  " })).toBe(false);
    expect(canSave({ ...toDraft(routine), exercises: [] })).toBe(false);
    expect(canSave(toDraft(routine))).toBe(true);
  });
});
