import { beforeEach, describe, expect, it, vi } from "vitest";

import { $Enums } from "@better-lift/db";
import {
  apiErrorSchema,
  recordTypeSchema,
  workoutSaveResponseSchema,
} from "@better-lift/validators";

const getSession = vi.hoisted(() => vi.fn());
const findUniqueWorkout = vi.hoisted(() => vi.fn());
const findFirstWorkout = vi.hoisted(() => vi.fn());
const findManyWorkouts = vi.hoisted(() => vi.fn());
const createWorkoutRow = vi.hoisted(() => vi.fn());
const updateWorkoutRow = vi.hoisted(() => vi.fn());
const deleteWorkoutRow = vi.hoisted(() => vi.fn());
const aggregateWorkouts = vi.hoisted(() => vi.fn());
const deleteManyWorkoutExercises = vi.hoisted(() => vi.fn());
const findFirstWorkoutExercise = vi.hoisted(() => vi.fn());
const findManyWorkoutSets = vi.hoisted(() => vi.fn());
const updateManyWorkoutSets = vi.hoisted(() => vi.fn());
const findManyRecords = vi.hoisted(() => vi.fn());
const deleteManyRecords = vi.hoisted(() => vi.fn());
const createManyRecords = vi.hoisted(() => vi.fn());
const findFirstRoutine = vi.hoisted(() => vi.fn());
const updateManyRoutines = vi.hoisted(() => vi.fn());
const findManyExercises = vi.hoisted(() => vi.fn());
const findUniqueOrThrowUser = vi.hoisted(() => vi.fn());

vi.mock("@better-lift/db", async (importOriginal) => {
  const original = await importOriginal<typeof import("@better-lift/db")>();

  const client = {
    workout: {
      findUnique: findUniqueWorkout,
      findFirst: findFirstWorkout,
      findMany: findManyWorkouts,
      create: createWorkoutRow,
      update: updateWorkoutRow,
      delete: deleteWorkoutRow,
      aggregate: aggregateWorkouts,
    },
    workoutExercise: {
      deleteMany: deleteManyWorkoutExercises,
      findFirst: findFirstWorkoutExercise,
    },
    workoutSet: { findMany: findManyWorkoutSets, updateMany: updateManyWorkoutSets },
    personalRecord: {
      findMany: findManyRecords,
      deleteMany: deleteManyRecords,
      createMany: createManyRecords,
    },
    routine: { findFirst: findFirstRoutine, updateMany: updateManyRoutines },
    exercise: { findMany: findManyExercises },
    user: { findUniqueOrThrow: findUniqueOrThrowUser },
    $transaction: (arg: unknown) =>
      typeof arg === "function"
        ? (arg as (tx: unknown) => unknown)(client)
        : Promise.all(arg as Promise<unknown>[]),
  };

  // `$Enums` reste le vrai : le test d'alignement des énumérations n'aurait
  // aucune valeur contre une copie écrite à la main.
  return { $Enums: original.$Enums, checkDatabaseConnection: vi.fn(), prisma: client };
});

vi.mock("../lib/auth.js", () => ({
  auth: { api: { getSession }, handler: vi.fn() },
}));

const { createApp } = await import("../app.js");

const app = createApp();

/** Imite un `Decimal` Prisma : le service n'en appelle que `toFixed`/`toString`. */
function dec(value: number) {
  return {
    toFixed: (digits: number) => value.toFixed(digits),
    toString: () => String(value),
  };
}

function exerciseRow(id = "exo_1") {
  return {
    id,
    externalId: "0025",
    slug: "barbell-bench-press",
    name: "Barbell bench press",
    type: "WEIGHT_REPS",
    bodyPart: "CHEST",
    equipment: "barbell",
    target: "pectorals",
    secondaryMuscles: ["triceps"],
    thumbnailUrl: null,
    animationUrl: null,
    attribution: null,
    isArchived: false,
    ownerId: null,
    translations: [{ locale: "fr", name: "Développé couché", instructions: [] }],
  };
}

function workoutRow(overrides: Record<string, unknown> = {}) {
  return {
    id: "wkt_local_1",
    userId: "usr_1",
    routineId: null,
    title: "Push A",
    notes: null,
    startedAt: new Date("2026-08-02T17:02:00.000Z"),
    endedAt: new Date("2026-08-02T18:14:00.000Z"),
    durationSec: 4320,
    totalVolumeKg: dec(500),
    totalSets: 1,
    totalReps: 5,
    prCount: 0,
    visibility: "PRIVATE",
    createdAt: new Date("2026-08-02T18:14:00.000Z"),
    updatedAt: new Date("2026-08-02T18:14:00.000Z"),
    exercises: [
      {
        id: "wex_1",
        position: 0,
        notes: null,
        restSec: 180,
        supersetGroup: null,
        exercise: exerciseRow(),
        sets: [
          {
            id: "wst_1",
            position: 0,
            type: "NORMAL",
            reps: 5,
            weightKg: dec(100),
            durationSec: null,
            distanceM: null,
            rpe: dec(8),
            completed: true,
            completedAt: new Date("2026-08-02T17:30:00.000Z"),
            isPr: true,
          },
        ],
      },
    ],
    ...overrides,
  };
}

/** Une séance réelle : un échauffement, une série validée, une série abandonnée. */
const PAYLOAD = {
  id: "wkt_local_1",
  title: "Push A",
  startedAt: "2026-08-02T17:02:00.000Z",
  endedAt: "2026-08-02T18:14:00.000Z",
  exercises: [
    {
      exerciseId: "exo_1",
      restSec: 180,
      sets: [
        { type: "WARMUP", reps: 10, weightKg: "40.00", completed: true },
        { type: "NORMAL", reps: 5, weightKg: "100.00", rpe: "8.0", completed: true },
        { type: "NORMAL", reps: 5, weightKg: "100.00", completed: false },
      ],
    },
  ],
};

/** Série telle que le recalcul des records la relit, jointures comprises. */
function recordedSet(overrides: Record<string, unknown> = {}) {
  return {
    id: "wst_1",
    type: "NORMAL",
    completed: true,
    reps: 5,
    weightKg: dec(100),
    durationSec: null,
    distanceM: null,
    completedAt: new Date("2026-08-02T17:30:00.000Z"),
    workoutExercise: {
      exerciseId: "exo_1",
      workoutId: "wkt_local_1",
      exercise: { type: "WEIGHT_REPS" },
      workout: { startedAt: new Date("2026-08-02T17:02:00.000Z") },
    },
    ...overrides,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  // Sert les deux lectures d'exercices du service : le contrôle de visibilité,
  // qui veut le type, et le nom affiché des records, qui veut la traduction.
  findManyExercises.mockResolvedValue([
    {
      id: "exo_1",
      type: "WEIGHT_REPS",
      name: "Barbell bench press",
      translations: [{ locale: "fr", name: "Développé couché" }],
    },
  ]);
  findUniqueOrThrowUser.mockResolvedValue({ defaultVisibility: "PRIVATE" });
  findManyRecords.mockResolvedValue([]);
  findManyWorkoutSets.mockResolvedValue([]);
  createWorkoutRow.mockResolvedValue(workoutRow());
  updateWorkoutRow.mockResolvedValue(workoutRow());
  findUniqueWorkout.mockResolvedValue(workoutRow());
});

function authenticate() {
  getSession.mockResolvedValue({
    user: {
      id: "usr_1",
      email: "alex@better-lift.local",
      name: "Alex",
      emailVerified: true,
      image: null,
      createdAt: new Date("2026-08-01T10:00:00.000Z"),
    },
  });
}

function post(body: unknown, path = "/v1/workouts") {
  return app.request(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("alignement des énumérations avec Prisma", () => {
  /**
   * `packages/validators` redéclare `RecordType` : le web et le mobile le
   * consomment et n'ont pas le droit de dépendre de `@better-lift/db`. Ajouter
   * un type de record au schéma sans l'ajouter au contrat produirait une valeur
   * en base qu'aucun client ne saurait afficher.
   */
  it("should expose exactly the RecordType values declared in the schema", () => {
    expect([...recordTypeSchema.options].sort()).toEqual(Object.values($Enums.RecordType).sort());
  });
});

describe("POST /v1/workouts", () => {
  it("should return 401 when no session is established", async () => {
    getSession.mockResolvedValue(null);

    expect((await post(PAYLOAD)).status).toBe(401);
  });

  /**
   * L'invariant qui compte le plus de tout ce fichier (règle non négociable
   * n°7). Une file de synchronisation hors ligne rejoue ses envois : sans
   * idempotence, chaque reprise réseau dupliquerait une séance.
   */
  it("should create once and return the existing workout when the id is replayed", async () => {
    authenticate();
    findUniqueWorkout.mockResolvedValueOnce(null).mockResolvedValue(workoutRow());

    const first = await post(PAYLOAD);

    expect(first.status).toBe(201);
    expect(createWorkoutRow).toHaveBeenCalledTimes(1);

    findUniqueWorkout.mockResolvedValueOnce({ userId: "usr_1" }).mockResolvedValue(workoutRow());

    const second = await post(PAYLOAD);

    expect(second.status).toBe(200);
    // Aucune seconde écriture, et aucun record annoncé une seconde fois.
    expect(createWorkoutRow).toHaveBeenCalledTimes(1);
    expect(workoutSaveResponseSchema.parse(await second.json()).newRecords).toEqual([]);
  });

  it("should return 409 when the id already belongs to someone else", async () => {
    authenticate();
    findUniqueWorkout.mockResolvedValueOnce({ userId: "usr_2" });

    const response = await post(PAYLOAD);

    // 409 et non 404 : le client doit générer un autre identifiant, là où un
    // 404 l'inviterait à réessayer à l'identique.
    expect(response.status).toBe(409);
    expect(apiErrorSchema.parse(await response.json()).error.code).toBe("CONFLICT");
    expect(createWorkoutRow).not.toHaveBeenCalled();
  });

  it("should exclude warm-up and unvalidated sets from the stored aggregates", async () => {
    authenticate();
    findUniqueWorkout.mockResolvedValueOnce(null).mockResolvedValue(workoutRow());

    await post(PAYLOAD);

    const data = createWorkoutRow.mock.calls[0]?.[0]?.data;

    // 40 × 10 est un échauffement, la troisième série n'a pas été validée :
    // seul 100 × 5 compte (invariant 1, doc 03).
    expect(data.totalVolumeKg).toBe("500.00");
    expect(data.totalSets).toBe(1);
    expect(data.totalReps).toBe(5);
    expect(data.durationSec).toBe(4320);
  });

  it("should assign positions from the array order", async () => {
    authenticate();
    findUniqueWorkout.mockResolvedValueOnce(null).mockResolvedValue(workoutRow());

    await post(PAYLOAD);

    const created = createWorkoutRow.mock.calls[0]?.[0]?.data?.exercises?.create;

    expect(created.map((entry: { position: number }) => entry.position)).toEqual([0]);
    expect(created[0].sets.create.map((entry: { position: number }) => entry.position)).toEqual([
      0, 1, 2,
    ]);
  });

  it("should date a validated set from the workout when the client sends none", async () => {
    authenticate();
    findUniqueWorkout.mockResolvedValueOnce(null).mockResolvedValue(workoutRow());

    await post(PAYLOAD);

    const sets = createWorkoutRow.mock.calls[0]?.[0]?.data?.exercises?.create[0]?.sets?.create;

    // Une série cochée a toujours une date : sinon chaque lecteur — records
    // compris — devrait inventer son propre repli.
    expect(sets[1].completedAt).toEqual(new Date("2026-08-02T18:14:00.000Z"));
    expect(sets[2].completedAt).toBeNull();
  });

  it("should reject a workout that ends before it starts", async () => {
    authenticate();

    const response = await post({
      ...PAYLOAD,
      endedAt: "2026-08-02T16:00:00.000Z",
    });

    expect(response.status).toBe(422);
    expect(apiErrorSchema.parse(await response.json()).error.code).toBe("VALIDATION_FAILED");
  });

  it("should ignore unknown fields rather than lose the workout", async () => {
    authenticate();
    findUniqueWorkout.mockResolvedValueOnce(null).mockResolvedValue(workoutRow());

    // Une séance arrive parfois d'un client resté en arrière plusieurs mois.
    const response = await post({ ...PAYLOAD, mood: "excellent", position: 3 });

    expect(response.status).toBe(201);
  });

  it("should return 404 when the origin routine belongs to someone else", async () => {
    authenticate();
    findUniqueWorkout.mockResolvedValueOnce(null);
    findFirstRoutine.mockResolvedValue(null);

    const response = await post({ ...PAYLOAD, routineId: "rtn_9" });

    expect(response.status).toBe(404);
    expect(findFirstRoutine.mock.calls[0]?.[0]?.where).toMatchObject({
      id: "rtn_9",
      userId: "usr_1",
    });
  });

  it("should reject an exercise the caller cannot see", async () => {
    authenticate();
    findUniqueWorkout.mockResolvedValueOnce(null);
    findManyExercises.mockResolvedValue([]);

    const response = await post(PAYLOAD);

    // Glisser l'identifiant d'un exercice personnalisé d'autrui suffirait sinon
    // à le lire dans sa propre séance : la clé étrangère l'accepterait.
    expect(response.status).toBe(422);
    expect(findManyExercises.mock.calls[0]?.[0]?.where?.OR).toEqual([
      { ownerId: null },
      { ownerId: "usr_1" },
    ]);
  });

  it("should still accept a workout whose exercise was archived since", async () => {
    authenticate();
    findUniqueWorkout.mockResolvedValueOnce(null).mockResolvedValue(workoutRow());

    await post(PAYLOAD);

    // L'archivage est une préférence de catalogue, pas une frontière de
    // sécurité : refuser ferait perdre un entraînement réel.
    expect(findManyExercises.mock.calls[0]?.[0]?.where).not.toHaveProperty("isArchived");
  });
});

describe("records", () => {
  it("should compute records server-side from validated sets only", async () => {
    authenticate();
    findUniqueWorkout.mockResolvedValueOnce(null).mockResolvedValue(workoutRow());
    findManyWorkoutSets.mockResolvedValue([recordedSet()]);

    const response = await post(PAYLOAD);
    const payload = workoutSaveResponseSchema.parse(await response.json());

    // L'échauffement est exclu à la source, dans la requête elle-même.
    expect(findManyWorkoutSets.mock.calls[0]?.[0]?.where).toMatchObject({
      completed: true,
      type: { not: "WARMUP" },
    });

    const written = createManyRecords.mock.calls[0]?.[0]?.data as {
      type: string;
      value: string;
    }[];
    const byType = new Map(written.map((row) => [row.type, row.value]));

    expect(byType.get("BEST_WEIGHT")).toBe("100.00");
    expect(byType.get("BEST_SET_VOLUME")).toBe("500.00");
    // Epley : 100 × (1 + 5/30) = 116,67.
    expect(byType.get("BEST_1RM")).toBe("116.67");

    expect(payload.newRecords).toContainEqual({
      exerciseId: "exo_1",
      exerciseName: "Développé couché",
      type: "BEST_WEIGHT",
      value: "100.00",
      previousValue: null,
    });
  });

  /**
   * Un record ne baisse jamais. Le recalcul repart de l'historique complet :
   * une séance plus faible que le record en place ne le remplace pas, et le
   * détenteur d'origine garde sa ligne.
   */
  it("should keep the previous holder when the new workout is weaker", async () => {
    authenticate();
    findUniqueWorkout.mockResolvedValueOnce(null).mockResolvedValue(workoutRow());
    findManyRecords.mockResolvedValue([
      { exerciseId: "exo_1", type: "BEST_WEIGHT", value: dec(120) },
    ]);
    findManyWorkoutSets.mockResolvedValue([
      recordedSet({
        id: "wst_old",
        reps: 3,
        weightKg: dec(120),
        completedAt: new Date("2026-07-20T10:00:00.000Z"),
        workoutExercise: {
          exerciseId: "exo_1",
          workoutId: "wkt_old",
          exercise: { type: "WEIGHT_REPS" },
          workout: { startedAt: new Date("2026-07-20T09:00:00.000Z") },
        },
      }),
      recordedSet(),
    ]);

    const response = await post(PAYLOAD);
    const payload = workoutSaveResponseSchema.parse(await response.json());

    const written = createManyRecords.mock.calls[0]?.[0]?.data as {
      type: string;
      value: string;
      workoutId: string;
    }[];
    const bestWeight = written.find((row) => row.type === "BEST_WEIGHT");

    expect(bestWeight?.value).toBe("120.00");
    expect(bestWeight?.workoutId).toBe("wkt_old");
    // Rien à annoncer : la séance du jour n'a battu aucune charge.
    expect(payload.newRecords.some((record) => record.type === "BEST_WEIGHT")).toBe(false);
  });

  it("should clear the trophy of a set that no longer holds a record", async () => {
    authenticate();
    findUniqueWorkout.mockResolvedValueOnce(null).mockResolvedValue(workoutRow());
    findManyWorkoutSets.mockResolvedValue([recordedSet()]);

    await post(PAYLOAD);

    // `isPr` est remis à plat pour les exercices touchés avant d'être reposé :
    // sans cela, une correction laisserait un trophée sur une série déchue.
    expect(updateManyWorkoutSets.mock.calls[0]?.[0]).toMatchObject({
      where: { isPr: true },
      data: { isPr: false },
    });
    expect(updateManyWorkoutSets.mock.calls[1]?.[0]?.data).toEqual({ isPr: true });
  });
});

describe("GET /v1/workouts/:id", () => {
  it("should return 404 when the workout belongs to someone else", async () => {
    authenticate();
    findFirstWorkout.mockResolvedValue(null);

    const response = await app.request("/v1/workouts/wkt_9");

    expect(response.status).toBe(404);
    // L'appartenance est dans la requête, pas dans un test après coup.
    expect(findFirstWorkout.mock.calls[0]?.[0]?.where).toMatchObject({
      id: "wkt_9",
      userId: "usr_1",
    });
  });

  it("should serialise decimals as strings at their column scale", async () => {
    authenticate();
    findFirstWorkout.mockResolvedValue(workoutRow());

    const response = await app.request("/v1/workouts/wkt_local_1");
    const payload = await response.json();

    expect(payload.exercises[0].sets[0].weightKg).toBe("100.00");
    expect(payload.exercises[0].sets[0].rpe).toBe("8.0");
    expect(payload.totalVolumeKg).toBe("500.00");
  });
});

describe("GET /v1/workouts", () => {
  it("should page by cursor on a deterministic order", async () => {
    authenticate();
    findManyWorkouts.mockResolvedValue([]);

    await app.request("/v1/workouts?limit=2&cursor=wkt_7");

    const args = findManyWorkouts.mock.calls[0]?.[0];

    expect(args.where).toMatchObject({ userId: "usr_1" });
    // `id` départage deux séances du même instant : sans lui, un curseur sur un
    // ordre instable saute ou répète des lignes.
    expect(args.orderBy).toEqual([{ startedAt: "desc" }, { id: "asc" }]);
    expect(args.take).toBe(3);
    expect(args.cursor).toEqual({ id: "wkt_7" });
  });
});

describe("DELETE /v1/workouts/:id", () => {
  it("should rebuild the records the deleted workout was holding", async () => {
    authenticate();
    findFirstWorkout.mockResolvedValue({
      routineId: "rtn_1",
      exercises: [{ exerciseId: "exo_1" }],
    });
    aggregateWorkouts.mockResolvedValue({ _max: { startedAt: null }, _count: 0 });

    const response = await app.request("/v1/workouts/wkt_local_1", { method: "DELETE" });

    expect(response.status).toBe(204);
    expect(deleteWorkoutRow).toHaveBeenCalled();
    // Le second meilleur remonte : c'est le cas que seul un recalcul complet
    // sait traiter (invariant 7, doc 03).
    expect(deleteManyRecords).toHaveBeenCalled();
    // Les compteurs de la routine sont relus depuis les séances restantes.
    expect(updateManyRoutines.mock.calls[0]?.[0]?.data).toEqual({
      performedCount: 0,
      lastPerformedAt: null,
    });
  });
});

describe("GET /v1/workouts/last-performance", () => {
  it("should omit exercises that were never performed", async () => {
    authenticate();
    findFirstWorkoutExercise
      .mockResolvedValueOnce({
        workout: { id: "wkt_local_1", startedAt: new Date("2026-08-02T17:02:00.000Z") },
        sets: [
          {
            position: 0,
            type: "NORMAL",
            reps: 5,
            weightKg: dec(100),
            durationSec: null,
            distanceM: null,
            rpe: null,
          },
        ],
      })
      .mockResolvedValueOnce(null);

    const response = await app.request("/v1/workouts/last-performance?exerciseIds=exo_1,exo_2");
    const payload = await response.json();

    // Absent plutôt que présent avec des valeurs nulles : le client teste la
    // présence, et n'a pas à distinguer « jamais fait » de « fait sans rien ».
    expect(payload.data).toHaveLength(1);
    expect(payload.data[0].exerciseId).toBe("exo_1");
    expect(payload.data[0].sets[0].weightKg).toBe("100.00");
  });

  it("should require at least one exercise id", async () => {
    authenticate();

    expect((await app.request("/v1/workouts/last-performance")).status).toBe(422);
  });
});
