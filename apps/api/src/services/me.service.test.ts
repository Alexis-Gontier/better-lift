import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * L'ordre de la purge est un **invariant de schéma**, pas un détail
 * d'implémentation : `RoutineExercise` et `WorkoutExercise` référencent
 * `Exercise` en `onDelete: Restrict` (invariant 8, doc 03), et Postgres vérifie
 * un `RESTRICT` immédiatement, sans attendre la fin de la cascade. Effacer les
 * exercices personnalisés avant les séances qui les citent ferait donc échouer
 * la suppression du compte — pour les seuls comptes ayant utilisé leur propre
 * exercice, c'est-à-dire ceux qui se servent le plus de l'application.
 *
 * Rien dans le code de `purgeUserData` ne rend cet ordre visible : d'où ce test.
 */
const order = vi.hoisted(() => [] as string[]);

const spies = vi.hoisted(() => {
  const model = (name: string) => ({
    deleteMany: vi.fn((args: unknown) => {
      order.push(name);

      return args;
    }),
  });

  return {
    workout: model("workout"),
    personalRecord: model("personalRecord"),
    routine: model("routine"),
    routineFolder: model("routineFolder"),
    exercise: model("exercise"),
    $transaction: vi.fn(),
  };
});

vi.mock("@better-lift/db", () => ({
  prisma: spies,
  Prisma: { PrismaClientKnownRequestError: class extends Error {} },
}));

const { purgeUserData } = await import("./me.service.js");

beforeEach(() => {
  order.length = 0;
  vi.clearAllMocks();
});

describe("purgeUserData", () => {
  it("should delete workouts and routines before the custom exercises they reference", async () => {
    await purgeUserData("usr_1");

    expect(order).toEqual(["workout", "personalRecord", "routine", "routineFolder", "exercise"]);
  });

  it("should scope every deletion to the account being closed", async () => {
    await purgeUserData("usr_1");

    // L'exercice personnalisé se reconnaît à son propriétaire, jamais à un
    // booléen (D22) : c'est `ownerId` qui le distingue du catalogue commun,
    // lequel n'appartient à personne et ne doit surtout pas partir.
    expect(spies.exercise.deleteMany.mock.calls[0]?.[0]).toEqual({
      where: { ownerId: "usr_1" },
    });

    for (const model of [spies.workout, spies.personalRecord, spies.routine, spies.routineFolder]) {
      expect(model.deleteMany.mock.calls[0]?.[0]).toEqual({ where: { userId: "usr_1" } });
    }
  });

  /** Un compte à moitié supprimé serait pire que pas supprimé du tout. */
  it("should run the whole purge in a single transaction", async () => {
    await purgeUserData("usr_1");

    expect(spies.$transaction).toHaveBeenCalledTimes(1);
    expect(spies.$transaction.mock.calls[0]?.[0]).toHaveLength(5);
  });
});
