import { beforeEach, describe, expect, it, vi } from "vitest";

import { apiErrorSchema, routineDetailSchema } from "@better-lift/validators";

const getSession = vi.hoisted(() => vi.fn());
const findManyRoutines = vi.hoisted(() => vi.fn());
const findFirstRoutine = vi.hoisted(() => vi.fn());
const createRoutineRow = vi.hoisted(() => vi.fn());
const updateRoutineRow = vi.hoisted(() => vi.fn());
const updateManyRoutines = vi.hoisted(() => vi.fn());
const aggregateRoutines = vi.hoisted(() => vi.fn());
const deleteManyRoutineExercises = vi.hoisted(() => vi.fn());
const findManyExercises = vi.hoisted(() => vi.fn());
const findFirstFolder = vi.hoisted(() => vi.fn());

vi.mock("@better-lift/db", () => {
  const client = {
    routine: {
      findMany: findManyRoutines,
      findFirst: findFirstRoutine,
      create: createRoutineRow,
      update: updateRoutineRow,
      updateMany: updateManyRoutines,
      aggregate: aggregateRoutines,
    },
    routineExercise: { deleteMany: deleteManyRoutineExercises },
    routineFolder: { findFirst: findFirstFolder },
    exercise: { findMany: findManyExercises },
    /**
     * Les deux formes de `$transaction` sont servies : le tableau d'écritures
     * (réordonnancement) et la fonction (remplacement d'une structure).
     */
    $transaction: (arg: unknown) =>
      typeof arg === "function"
        ? (arg as (tx: unknown) => unknown)(client)
        : Promise.all(arg as Promise<unknown>[]),
  };

  return { checkDatabaseConnection: vi.fn(), prisma: client };
});

vi.mock("../lib/auth.js", () => ({
  auth: { api: { getSession }, handler: vi.fn() },
}));

const { createApp } = await import("../app.js");

const app = createApp();

beforeEach(() => {
  vi.clearAllMocks();
  aggregateRoutines.mockResolvedValue({ _max: { position: null } });
  findFirstFolder.mockResolvedValue({ id: "fld_1" });
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

/** Imite un `Decimal` Prisma : seul `toFixed` est appelé par le service. */
function dec(value: number) {
  return { toFixed: (digits: number) => value.toFixed(digits) };
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

/** Ligne de routine telle que les lectures la ramènent, structure comprise. */
function routineRow(overrides: Record<string, unknown> = {}) {
  return {
    id: "rtn_1",
    userId: "usr_1",
    folderId: null,
    name: "Push A",
    notes: null,
    position: 0,
    lastPerformedAt: null,
    performedCount: 0,
    createdAt: new Date("2026-08-01T10:00:00.000Z"),
    updatedAt: new Date("2026-08-01T10:00:00.000Z"),
    deletedAt: null,
    exercises: [
      {
        id: "rex_1",
        position: 0,
        notes: null,
        restSec: 180,
        supersetGroup: null,
        exercise: exerciseRow(),
        sets: [
          {
            id: "rst_1",
            position: 0,
            type: "NORMAL",
            targetReps: 5,
            targetWeightKg: dec(100),
            targetDurationSec: null,
            targetDistanceM: null,
            targetRpe: dec(8),
          },
        ],
      },
    ],
    ...overrides,
  };
}

const STRUCTURE = {
  name: "Push A",
  exercises: [
    {
      exerciseId: "exo_1",
      restSec: 180,
      sets: [
        { type: "WARMUP", targetReps: 10, targetWeightKg: "40.00" },
        { type: "NORMAL", targetReps: 5, targetWeightKg: "100.00", targetRpe: "8.0" },
      ],
    },
  ],
};

function post(body: unknown, path = "/v1/routines") {
  return app.request(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("GET /v1/routines", () => {
  it("should return 401 when no session is established", async () => {
    getSession.mockResolvedValue(null);

    expect((await app.request("/v1/routines")).status).toBe(401);
  });

  it("should scope the listing to the caller and hide deleted routines", async () => {
    authenticate();
    findManyRoutines.mockResolvedValue([]);

    await app.request("/v1/routines");

    // Une routine supprimée reste en base pour l'historique : elle ne se liste
    // plus (règle non négociable n°5).
    expect(findManyRoutines.mock.calls[0]?.[0]?.where).toMatchObject({
      userId: "usr_1",
      deletedAt: null,
    });
  });

  it("should put never-performed routines last when sorting by recency", async () => {
    authenticate();
    findManyRoutines.mockResolvedValue([]);

    await app.request("/v1/routines?sort=recent");

    // Sans `nulls: "last"`, Postgres remonte les NULL en tête d'un tri
    // descendant : les routines jamais faites passeraient avant les autres.
    expect(findManyRoutines.mock.calls[0]?.[0]?.orderBy?.[0]).toEqual({
      lastPerformedAt: { sort: "desc", nulls: "last" },
    });
  });
});

describe("GET /v1/routines/:id", () => {
  it("should return 404 when the routine belongs to someone else", async () => {
    authenticate();
    findFirstRoutine.mockResolvedValue(null);

    const response = await app.request("/v1/routines/rtn_9");

    expect(response.status).toBe(404);
    expect(apiErrorSchema.parse(await response.json()).error.code).toBe("NOT_FOUND");
    // L'appartenance est dans la requête, pas dans un test après coup.
    expect(findFirstRoutine.mock.calls[0]?.[0]?.where).toMatchObject({
      id: "rtn_9",
      userId: "usr_1",
      deletedAt: null,
    });
  });

  it("should serialise decimals as strings at their column scale", async () => {
    authenticate();
    findFirstRoutine.mockResolvedValue(routineRow());

    const response = await app.request("/v1/routines/rtn_1");
    const payload = routineDetailSchema.parse(await response.json());

    // `toString()` donnerait "100" et "8" : deux charges qui se comparent mal.
    expect(payload.exercises[0]?.sets[0]?.targetWeightKg).toBe("100.00");
    expect(payload.exercises[0]?.sets[0]?.targetRpe).toBe("8.0");
  });
});

describe("POST /v1/routines", () => {
  it("should assign positions from the array order", async () => {
    authenticate();
    findManyExercises.mockResolvedValue([{ id: "exo_1" }, { id: "exo_2" }]);
    createRoutineRow.mockResolvedValue(routineRow());

    await post({
      name: "Push A",
      exercises: [
        { exerciseId: "exo_1", sets: [{ targetReps: 5 }] },
        { exerciseId: "exo_2", sets: [{ targetReps: 8 }, { targetReps: 8 }] },
      ],
    });

    // Le client n'envoie aucune position : la laisser fournir, c'est accepter
    // une suite à trous ou deux fois la même (doc 04).
    const created = createRoutineRow.mock.calls[0]?.[0]?.data?.exercises?.create;

    expect(created.map((entry: { position: number }) => entry.position)).toEqual([0, 1]);
    expect(created[1].sets.create.map((set: { position: number }) => set.position)).toEqual([0, 1]);
  });

  it("should drop a superset group left with a single exercise", async () => {
    authenticate();
    findManyExercises.mockResolvedValue([{ id: "exo_1" }]);
    createRoutineRow.mockResolvedValue(routineRow());

    await post({
      name: "Push A",
      exercises: [{ exerciseId: "exo_1", supersetGroup: 1, sets: [{ targetReps: 5 }] }],
    });

    /**
     * Invariant 4 (doc 03) : à un seul exercice, ce n'est pas un superset. Le
     * cas arrive tout seul — on en crée un de deux, puis on en supprime un.
     */
    expect(createRoutineRow.mock.calls[0]?.[0]?.data?.exercises?.create[0]).toMatchObject({
      supersetGroup: null,
    });
  });

  it("should keep a superset group shared by two exercises", async () => {
    authenticate();
    findManyExercises.mockResolvedValue([{ id: "exo_1" }, { id: "exo_2" }]);
    createRoutineRow.mockResolvedValue(routineRow());

    await post({
      name: "Push A",
      exercises: [
        { exerciseId: "exo_1", supersetGroup: 1, sets: [{ targetReps: 5 }] },
        { exerciseId: "exo_2", supersetGroup: 1, sets: [{ targetReps: 5 }] },
      ],
    });

    const created = createRoutineRow.mock.calls[0]?.[0]?.data?.exercises?.create;

    expect(created.map((entry: { supersetGroup: number | null }) => entry.supersetGroup)).toEqual([
      1, 1,
    ]);
  });

  it("should refuse an exercise the caller cannot see", async () => {
    authenticate();
    // L'exercice personnalisé d'un autre : la clé étrangère l'accepterait.
    findManyExercises.mockResolvedValue([]);

    const response = await post({
      name: "Vol",
      exercises: [{ exerciseId: "exo_dautrui", sets: [{ targetReps: 5 }] }],
    });

    expect(response.status).toBe(422);
    expect(apiErrorSchema.parse(await response.json()).error.code).toBe("VALIDATION_FAILED");
    expect(createRoutineRow).not.toHaveBeenCalled();
  });

  it("should restrict the visibility check to the catalogue and the caller's exercises", async () => {
    authenticate();
    findManyExercises.mockResolvedValue([{ id: "exo_1" }]);
    createRoutineRow.mockResolvedValue(routineRow());

    await post(STRUCTURE);

    expect(findManyExercises.mock.calls[0]?.[0]?.where).toMatchObject({
      isArchived: false,
      OR: [{ ownerId: null }, { ownerId: "usr_1" }],
    });
  });

  it("should return 404 when the target folder is not the caller's", async () => {
    authenticate();
    findFirstFolder.mockResolvedValue(null);

    const response = await post({ ...STRUCTURE, folderId: "fld_dautrui" });

    expect(response.status).toBe(404);
  });

  it("should reject an unknown field rather than ignoring it", async () => {
    authenticate();

    expect((await post({ ...STRUCTURE, position: 3 })).status).toBe(422);
  });

  it("should reject a weight that is not a decimal string", async () => {
    authenticate();

    // Les charges voyagent en chaîne (doc 04) : un nombre JSON perdrait de la
    // précision avant même d'arriver.
    const response = await post({
      name: "Push A",
      exercises: [{ exerciseId: "exo_1", sets: [{ targetWeightKg: 100.5 }] }],
    });

    expect(response.status).toBe(422);
  });
});

describe("PUT /v1/routines/:id", () => {
  function put(id: string, body: unknown) {
    return app.request(`/v1/routines/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  }

  it("should return 404 when the routine belongs to someone else", async () => {
    authenticate();
    findFirstRoutine.mockResolvedValue(null);

    expect((await put("rtn_9", STRUCTURE)).status).toBe(404);
    expect(deleteManyRoutineExercises).not.toHaveBeenCalled();
  });

  it("should clear the previous structure before recreating it", async () => {
    authenticate();
    findFirstRoutine.mockResolvedValue({ id: "rtn_1" });
    findManyExercises.mockResolvedValue([{ id: "exo_1" }]);
    updateRoutineRow.mockResolvedValue(routineRow());

    const response = await put("rtn_1", STRUCTURE);

    expect(response.status).toBe(200);
    /**
     * Le remplacement est intégral. Rapprocher les lignes une à une
     * demanderait une clé stable que l'éditeur n'a pas, et un échange de
     * positions violerait `@@unique([routineId, position])` en cours de route.
     */
    expect(deleteManyRoutineExercises.mock.calls[0]?.[0]).toEqual({
      where: { routineId: "rtn_1" },
    });
    expect(updateRoutineRow.mock.calls[0]?.[0]?.data?.exercises?.create).toHaveLength(1);
  });
});

describe("DELETE /v1/routines/:id", () => {
  it("should delete logically so history keeps pointing at the routine", async () => {
    authenticate();
    updateManyRoutines.mockResolvedValue({ count: 1 });

    const response = await app.request("/v1/routines/rtn_1", { method: "DELETE" });

    expect(response.status).toBe(204);
    expect(updateManyRoutines.mock.calls[0]?.[0]?.data?.deletedAt).toBeInstanceOf(Date);
  });

  it("should return 404 when the routine belongs to someone else", async () => {
    authenticate();
    updateManyRoutines.mockResolvedValue({ count: 0 });

    expect((await app.request("/v1/routines/rtn_9", { method: "DELETE" })).status).toBe(404);
  });
});

describe("POST /v1/routines/:id/duplicate", () => {
  it("should not carry over the performance counters", async () => {
    authenticate();
    findFirstRoutine.mockResolvedValue({
      ...routineRow(),
      performedCount: 12,
      lastPerformedAt: new Date("2026-07-30T18:00:00.000Z"),
    });
    createRoutineRow.mockResolvedValue(routineRow({ name: "Push A (copie)" }));

    const response = await post(null, "/v1/routines/rtn_1/duplicate");

    expect(response.status).toBe(201);

    const { data } = createRoutineRow.mock.calls[0]?.[0] ?? {};

    // La copie n'a jamais été faite : hériter des compteurs fausserait le tri
    // « dernière utilisée » dès le lendemain.
    expect(data.performedCount).toBeUndefined();
    expect(data.lastPerformedAt).toBeUndefined();
    expect(data.name).toBe("Push A (copie)");
  });

  it("should return 404 when the routine belongs to someone else", async () => {
    authenticate();
    findFirstRoutine.mockResolvedValue(null);

    expect((await post(null, "/v1/routines/rtn_9/duplicate")).status).toBe(404);
  });
});

describe("POST /v1/routines/reorder", () => {
  it("should write contiguous positions and ignore what is not the caller's", async () => {
    authenticate();
    findManyRoutines.mockResolvedValueOnce([{ id: "rtn_1" }, { id: "rtn_2" }]);
    updateRoutineRow.mockResolvedValue({});
    findManyRoutines.mockResolvedValueOnce([]);

    const response = await post({ ids: ["rtn_2", "rtn_dautrui", "rtn_1"] }, "/v1/routines/reorder");

    expect(response.status).toBe(200);
    /**
     * L'identifiant étranger est écarté, et les positions restent contiguës à
     * partir de 0 (invariant 3). Faire échouer tout le geste parce qu'une
     * routine a disparu dans un autre onglet serait pénible pour rien.
     */
    expect(updateRoutineRow.mock.calls.map((call) => call[0])).toEqual([
      { where: { id: "rtn_2" }, data: { position: 0 } },
      { where: { id: "rtn_1" }, data: { position: 1 } },
    ]);
  });
});
