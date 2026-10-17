import { describe, expect, it } from "vitest";
import type { MockRoutine } from "@/mocks/routines";
import {
  canLinkWithNext,
  canSave,
  chainsIntoNext,
  changeSummary,
  copyFirstToAll,
  emptyDraft,
  fromDraft,
  fromLastTime,
  isDirty,
  linkWithNext,
  normalizeSupersets,
  saveBlocker,
  setLabels,
  setsSummary,
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

describe("étiquettes des séries", () => {
  it("numérote les séries normales entre elles", () => {
    expect(setLabels([{ type: "warmup" }, {}, {}, { type: "drop" }])).toEqual(["W", "1", "2", "D"]);
  });

  it("marque une série à l'échec", () => {
    expect(setLabels([{}, { type: "failure" }, {}])).toEqual(["1", "F", "2"]);
  });
});

describe("raison d'un enregistrement impossible", () => {
  it("demande un nom, puis un exercice", () => {
    expect(saveBlocker(emptyDraft)).toBe("Donnez-lui un nom");
    expect(saveBlocker({ ...emptyDraft, name: "Push" })).toBe("Ajoutez au moins un exercice");
    expect(saveBlocker(toDraft(routine))).toBeNull();
  });
});

describe("actions groupées sur les séries", () => {
  it("donne la première série normale aux autres, sans toucher aux séries typées", () => {
    const sets = [
      { kg: 20, reps: 15, type: "warmup" as const },
      { kg: 80, reps: 10 },
      { kg: 75, reps: 8 },
      { kg: 60, reps: 12, type: "drop" as const },
    ];
    expect(copyFirstToAll(sets).map((s) => [s.kg, s.reps])).toEqual([
      [20, 15],
      [80, 10],
      [80, 10],
      [60, 12],
    ]);
  });

  it("recopie la dernière séance rang par rang, puis la dernière série connue", () => {
    const sets = [
      { kg: 0, reps: 10 },
      { kg: 0, reps: 10 },
      { kg: 0, reps: 10 },
    ];
    const last = [
      [80, 10],
      [82.5, 8],
    ] as const;
    expect(fromLastTime(sets, last).map((s) => [s.kg, s.reps])).toEqual([
      [80, 10],
      [82.5, 8],
      [82.5, 8],
    ]);
    expect(fromLastTime(sets, undefined)).toEqual(sets);
  });
});

describe("résumé d'un exercice replié", () => {
  it("résume des séries identiques", () => {
    expect(
      setsSummary([
        { kg: 10, reps: 12 },
        { kg: 10, reps: 12 },
        { kg: 10, reps: 12 },
      ]),
    ).toBe("3 × 12 · 10 kg");
  });

  it("donne des plages quand les séries varient", () => {
    expect(
      setsSummary([
        { kg: 8, reps: 10 },
        { kg: 10, reps: 12 },
        { kg: 82.5, reps: 12 },
      ]),
    ).toBe("3 × 10–12 · 8–82,5 kg");
  });

  it("met les échauffements devant et tolère une charge non notée", () => {
    expect(
      setsSummary([
        { kg: 5, reps: 15, type: "warmup" },
        { kg: null, reps: 10 },
        { kg: null, reps: 10 },
      ]),
    ).toBe("1 W + 2 × 10 · — kg");
  });
});

describe("ce que le brouillon change", () => {
  it("ne compte rien sur une routine intacte", () => {
    expect(changeSummary(toDraft(routine), routine).count).toBe(0);
  });

  it("marque l'exercice modifié, l'ajouté, le retiré et le nom", () => {
    const d = toDraft(routine);
    const [first] = d.exercises;
    if (!first) throw new Error("fixture");
    const next = {
      ...d,
      name: "Push lourd",
      exercises: [
        { ...first, restSeconds: 120 },
        { uid: "neuf", slug: "dips", restSeconds: 90, sets: [{ kg: null, reps: 10 }] },
      ],
    };
    const s = changeSummary(next, routine);
    expect([...s.changed]).toEqual([first.uid]);
    expect([...s.added]).toEqual(["neuf"]);
    expect(s.removed).toBe(1);
    expect(s.others).toBe(1);
    expect(s.count).toBe(4);
  });

  it("compte un nouvel ordre pour un seul changement", () => {
    const d = toDraft(routine);
    const s = changeSummary({ ...d, exercises: [...d.exercises].reverse() }, routine);
    expect(s.changed.size).toBe(0);
    expect(s.count).toBe(1);
  });
});
