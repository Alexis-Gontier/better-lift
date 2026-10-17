import { describe, expect, it } from "vitest";
import type { MockRoutine } from "@/mocks/routines";
import {
  canLinkWithNext,
  canSave,
  chainsIntoNext,
  emptyDraft,
  fromDraft,
  isDirty,
  linkWithNext,
  normalizeSupersets,
  toDraft,
  unlink,
} from "./routine-draft";

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

describe("supersets", () => {
  const ex = (slug: string, superset?: string) => ({ slug, ...(superset ? { superset } : {}) });

  it("lie un exercice au suivant", () => {
    expect(linkWithNext([ex("a"), ex("b"), ex("c")], 0)).toEqual([
      ex("a", "A"),
      ex("b", "A"),
      ex("c"),
    ]);
  });

  it("agrandit un superset existant et renomme dans l'ordre", () => {
    const list = [ex("a"), ex("b"), ex("c", "A"), ex("d", "A")];
    expect(linkWithNext(list, 1)).toEqual([ex("a"), ex("b", "A"), ex("c", "A"), ex("d", "A")]);
    expect(linkWithNext(list, 0)).toEqual([ex("a", "A"), ex("b", "A"), ex("c", "B"), ex("d", "B")]);
  });

  it("fusionne deux supersets voisins", () => {
    const list = [ex("a", "A"), ex("b", "A"), ex("c", "B"), ex("d", "B")];
    expect(linkWithNext(list, 1).map((e) => e.superset)).toEqual(["A", "A", "A", "A"]);
  });

  it("ne lie pas le dernier", () => {
    expect(canLinkWithNext([ex("a"), ex("b")], 1)).toBe(false);
    expect(canLinkWithNext([ex("a", "A"), ex("b", "A")], 0)).toBe(false);
  });

  it("délier le milieu coupe le groupe ; un exercice seul perd sa lettre", () => {
    const list = [ex("a", "A"), ex("b", "A"), ex("c", "A")];
    expect(unlink(list, 1)).toEqual([ex("a"), ex("b"), ex("c")]);
    expect(unlink([ex("a", "A"), ex("b", "A"), ex("c", "A"), ex("d", "A")], 0)).toEqual([
      ex("a"),
      ex("b", "A"),
      ex("c", "A"),
      ex("d", "A"),
    ]);
  });

  it("un glisser qui sépare un groupe le défait", () => {
    expect(normalizeSupersets([ex("a", "A"), ex("x"), ex("b", "A")])).toEqual([
      ex("a"),
      ex("x"),
      ex("b"),
    ]);
  });

  it("seul le dernier d'un superset garde son repos", () => {
    const list = [ex("a", "A"), ex("b", "A"), ex("c")];
    expect([0, 1, 2].map((i) => chainsIntoNext(list, i))).toEqual([true, false, false]);
  });
});
