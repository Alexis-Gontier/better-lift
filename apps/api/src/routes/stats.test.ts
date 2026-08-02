import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  statsMuscleDistributionResponseSchema,
  statsRecordsResponseSchema,
  statsStreakResponseSchema,
  statsSummarySchema,
  statsVolumeResponseSchema,
} from "@better-lift/validators";

const getSession = vi.hoisted(() => vi.fn());
const aggregateWorkouts = vi.hoisted(() => vi.fn());
const findManyWorkouts = vi.hoisted(() => vi.fn());
const groupByWorkoutSets = vi.hoisted(() => vi.fn());
const findManyWorkoutExercises = vi.hoisted(() => vi.fn());
const findManyRecords = vi.hoisted(() => vi.fn());
const findUniqueUser = vi.hoisted(() => vi.fn());

vi.mock("@better-lift/db", async (importOriginal) => {
  const original = await importOriginal<typeof import("@better-lift/db")>();

  return {
    $Enums: original.$Enums,
    checkDatabaseConnection: vi.fn(),
    prisma: {
      workout: { aggregate: aggregateWorkouts, findMany: findManyWorkouts },
      workoutSet: { groupBy: groupByWorkoutSets },
      workoutExercise: { findMany: findManyWorkoutExercises },
      personalRecord: { findMany: findManyRecords },
      user: { findUnique: findUniqueUser },
    },
  };
});

vi.mock("../lib/auth.js", () => ({
  auth: { api: { getSession }, handler: vi.fn() },
}));

const { createApp } = await import("../app.js");

const app = createApp();

/** Imite un `Decimal` Prisma : le service n'en appelle que `toFixed` et `plus`. */
function dec(value: number) {
  const self = {
    toFixed: (digits: number) => value.toFixed(digits),
    toString: () => String(value),
    plus: (other: { toString: () => string }) => dec(value + Number(other.toString())),
  };

  return self;
}

function authenticate() {
  getSession.mockResolvedValue({ user: { id: "usr_1", email: "a@b.test" }, session: {} });
}

const get = (path: string) => app.request(path);

/**
 * Toutes les fenêtres sont calculées à partir de « maintenant ». Sans horloge
 * figée, les bornes attendues changeraient chaque jour et les tests
 * échoueraient à la première exécution du lendemain.
 */
const NOW = new Date("2026-08-02T10:00:00.000Z");

beforeEach(() => {
  vi.clearAllMocks();
  vi.useFakeTimers();
  vi.setSystemTime(NOW);

  findUniqueUser.mockResolvedValue({ timezone: "Europe/Paris" });
  aggregateWorkouts.mockResolvedValue({
    _count: { _all: 0 },
    _sum: { totalVolumeKg: null, durationSec: null, totalSets: null, prCount: null },
  });
  findManyWorkouts.mockResolvedValue([]);
  groupByWorkoutSets.mockResolvedValue([]);
  findManyWorkoutExercises.mockResolvedValue([]);
  findManyRecords.mockResolvedValue([]);
});

describe("protection du préfixe /v1/stats", () => {
  /**
   * Le `use` porte sur `/v1/stats/*` et non sur chaque route : une route
   * ajoutée plus tard sans son garde serait ouverte, et rien ne le signalerait.
   */
  it.each([
    "/v1/stats/summary",
    "/v1/stats/volume",
    "/v1/stats/muscle-distribution",
    "/v1/stats/streak",
    "/v1/stats/records",
  ])("should return 401 on %s when no session is established", async (path) => {
    getSession.mockResolvedValue(null);

    expect((await get(path)).status).toBe(401);
  });
});

describe("GET /v1/stats/summary", () => {
  it("should match the published contract", async () => {
    authenticate();
    aggregateWorkouts.mockResolvedValue({
      _count: { _all: 14 },
      _sum: {
        totalVolumeKg: dec(84_250),
        durationSec: 61_200,
        totalSets: 412,
        prCount: 6,
      },
    });

    const response = await get("/v1/stats/summary?range=30d");
    const body = statsSummarySchema.parse(await response.json());

    expect(response.status).toBe(200);
    expect(body.workoutCount).toBe(14);
    // Sérialisé en chaîne à l'échelle de la colonne (règle non négociable n°4).
    expect(body.totalVolumeKg).toBe("84250.00");
    expect(body.totalSets).toBe(412);
    expect(body.prCount).toBe(6);
  });

  it("should default to a 30-day range", async () => {
    authenticate();

    expect(statsSummarySchema.parse(await (await get("/v1/stats/summary")).json()).range).toBe(
      "30d",
    );
  });

  /**
   * Le piège classique de la moyenne : sans séance, `totalDurationSec / 0`
   * donne `NaN`, que Zod refuse — le tableau de bord d'un inscrit du jour
   * répondrait 500.
   */
  it("should return zero average duration rather than NaN without any workout", async () => {
    authenticate();

    const body = statsSummarySchema.parse(await (await get("/v1/stats/summary")).json());

    expect(body.avgDurationSec).toBe(0);
    expect(body.totalVolumeKg).toBe("0.00");
  });

  it("should compute the average duration over the workout count", async () => {
    authenticate();
    aggregateWorkouts.mockResolvedValue({
      _count: { _all: 4 },
      _sum: { totalVolumeKg: dec(100), durationSec: 14_400, totalSets: 40, prCount: 1 },
    });

    const body = statsSummarySchema.parse(await (await get("/v1/stats/summary")).json());

    expect(body.avgDurationSec).toBe(3600);
  });

  /**
   * `all` n'a pas d'avant : renvoyer des zéros ferait afficher une chute de
   * 100 % à qui regarde son total depuis l'inscription.
   */
  it("should return a null previous period for the all range", async () => {
    authenticate();

    const body = statsSummarySchema.parse(await (await get("/v1/stats/summary?range=all")).json());

    expect(body.previousPeriod).toBeNull();
    expect(body.from).toBeNull();
  });

  it("should return a previous period of the same length on a bounded range", async () => {
    authenticate();

    const body = statsSummarySchema.parse(await (await get("/v1/stats/summary?range=7d")).json());

    expect(body.previousPeriod).not.toBeNull();
    expect(body.from).not.toBeNull();
  });

  /**
   * Le fuseau du profil, pas UTC. Au 2 août à Paris (UTC+2), la fenêtre de
   * 7 jours commence le 27 juillet à minuit **locale**, soit 22 h UTC la veille.
   */
  it("should bound the window on the profile timezone, not UTC", async () => {
    authenticate();

    await get("/v1/stats/summary?range=7d");

    const where = aggregateWorkouts.mock.calls[0]?.[0]?.where;
    expect(where.userId).toBe("usr_1");
    expect(where.startedAt.gte.toISOString()).toBe("2026-07-26T22:00:00.000Z");
    expect(where.startedAt.lt.toISOString()).toBe("2026-08-02T22:00:00.000Z");
  });

  it("should fall back to UTC when the profile carries an invalid timezone", async () => {
    authenticate();
    // La colonne est un `String` libre : Better Auth crée des comptes sans
    // passer par nos validateurs. Un fuseau inconnu ne doit pas rendre 500.
    findUniqueUser.mockResolvedValue({ timezone: "Mars/Olympus_Mons" });

    const response = await get("/v1/stats/summary?range=7d");

    expect(response.status).toBe(200);
    expect(aggregateWorkouts.mock.calls[0]?.[0]?.where.startedAt.lt.toISOString()).toBe(
      "2026-08-03T00:00:00.000Z",
    );
  });

  it("should reject an unknown range", async () => {
    authenticate();

    expect((await get("/v1/stats/summary?range=42d")).status).toBe(422);
  });
});

describe("GET /v1/stats/volume", () => {
  /**
   * Le contrat central de cette route : un graphique qui saute les semaines
   * vides ment sur le rythme, et c'est justement la coupure involontaire qu'on
   * cherche à repérer.
   */
  it("should emit every week of the window, including the empty ones", async () => {
    authenticate();
    findManyWorkouts.mockResolvedValue([
      { startedAt: new Date("2026-07-29T17:00:00.000Z"), totalVolumeKg: dec(5000) },
    ]);

    const body = statsVolumeResponseSchema.parse(await (await get("/v1/stats/volume")).json());

    expect(body.groupBy).toBe("week");
    expect(body.data).toHaveLength(12);
    expect(body.data.every((point) => /^\d{4}-\d{2}-\d{2}$/.test(point.periodStart))).toBe(true);
    // La dernière période est celle du 2 août 2026, un dimanche : lundi 27.
    expect(body.data.at(-1)?.periodStart).toBe("2026-07-27");
    expect(body.data.at(-1)?.volumeKg).toBe("5000.00");
    expect(body.data.at(-2)?.volumeKg).toBe("0.00");
  });

  it("should start every week on a monday", async () => {
    authenticate();

    const body = statsVolumeResponseSchema.parse(await (await get("/v1/stats/volume")).json());

    for (const point of body.data) {
      expect(new Date(`${point.periodStart}T00:00:00Z`).getUTCDay()).toBe(1);
    }
  });

  it("should sum several workouts into the same bucket", async () => {
    authenticate();
    findManyWorkouts.mockResolvedValue([
      { startedAt: new Date("2026-07-28T17:00:00.000Z"), totalVolumeKg: dec(1000) },
      { startedAt: new Date("2026-07-30T17:00:00.000Z"), totalVolumeKg: dec(1500) },
    ]);

    const body = statsVolumeResponseSchema.parse(await (await get("/v1/stats/volume")).json());
    const week = body.data.find((point) => point.periodStart === "2026-07-27");

    expect(week?.volumeKg).toBe("2500.00");
    expect(week?.workoutCount).toBe(2);
  });

  it("should group by month when asked", async () => {
    authenticate();

    const body = statsVolumeResponseSchema.parse(
      await (await get("/v1/stats/volume?groupBy=month")).json(),
    );

    expect(body.groupBy).toBe("month");
    expect(body.data.every((point) => point.periodStart.endsWith("-01"))).toBe(true);
    expect(body.data.at(-1)?.periodStart).toBe("2026-08-01");
  });

  it("should reject an unknown grouping", async () => {
    authenticate();

    expect((await get("/v1/stats/volume?groupBy=day")).status).toBe(422);
  });
});

describe("GET /v1/stats/muscle-distribution", () => {
  it("should sort by set count and resolve body parts", async () => {
    authenticate();
    groupByWorkoutSets.mockResolvedValue([
      { workoutExerciseId: "wex_1", _count: { _all: 3 } },
      { workoutExerciseId: "wex_2", _count: { _all: 8 } },
      { workoutExerciseId: "wex_3", _count: { _all: 4 } },
    ]);
    findManyWorkoutExercises.mockResolvedValue([
      { id: "wex_1", exercise: { bodyPart: "CHEST" } },
      { id: "wex_2", exercise: { bodyPart: "BACK" } },
      { id: "wex_3", exercise: { bodyPart: "CHEST" } },
    ]);

    const body = statsMuscleDistributionResponseSchema.parse(
      await (await get("/v1/stats/muscle-distribution")).json(),
    );

    // CHEST cumule deux exercices : 3 + 4 = 7, donc devant BACK à 8 ? Non — 7 < 8.
    expect(body.data).toEqual([
      { bodyPart: "BACK", setCount: 8 },
      { bodyPart: "CHEST", setCount: 7 },
    ]);
    expect(body.totalSets).toBe(15);
  });

  /**
   * Compter ce qui a été planifié sans être fait décrirait l'intention, pas
   * l'entraînement. Même exclusion que partout ailleurs (doc 03).
   */
  it("should exclude warmup and uncompleted sets", async () => {
    authenticate();

    await get("/v1/stats/muscle-distribution");

    const where = groupByWorkoutSets.mock.calls[0]?.[0]?.where;
    expect(where.completed).toBe(true);
    expect(where.type).toEqual({ not: "WARMUP" });
    expect(where.workoutExercise.workout.userId).toBe("usr_1");
  });

  it("should return an empty distribution without any set", async () => {
    authenticate();

    const body = statsMuscleDistributionResponseSchema.parse(
      await (await get("/v1/stats/muscle-distribution")).json(),
    );

    expect(body).toEqual({ range: "30d", totalSets: 0, data: [] });
    // Rien à résoudre : la seconde requête n'a pas lieu d'être.
    expect(findManyWorkoutExercises).not.toHaveBeenCalled();
  });
});

describe("GET /v1/stats/streak", () => {
  it("should emit one entry per day over complete weeks", async () => {
    authenticate();

    const body = statsStreakResponseSchema.parse(await (await get("/v1/stats/streak")).json());

    /**
     * Le 2 août 2026 est un dimanche, donc une fin de semaine : douze semaines
     * pleines font exactement 84 jours, du lundi 11 mai au dimanche 2 août.
     * C'est ce qui rend la grille rectangulaire — une fenêtre qui ne commence
     * pas un lundi décalerait les colonnes les unes par rapport aux autres.
     */
    expect(body.days).toHaveLength(84);
    expect(body.days[0]?.date).toBe("2026-05-11");
    expect(body.days.at(-1)?.date).toBe("2026-08-02");
    expect(new Date(`${body.days[0]?.date}T00:00:00Z`).getUTCDay()).toBe(1);
  });

  it("should count workouts on the civil day of the profile timezone", async () => {
    authenticate();
    // 22 h 30 UTC le 1er août est déjà le 2 août à Paris.
    findManyWorkouts.mockResolvedValue([{ startedAt: new Date("2026-08-01T22:30:00.000Z") }]);

    const body = statsStreakResponseSchema.parse(await (await get("/v1/stats/streak")).json());

    expect(body.days.find((day) => day.date === "2026-08-02")?.workoutCount).toBe(1);
    expect(body.days.find((day) => day.date === "2026-08-01")?.workoutCount).toBe(0);
  });

  it("should honour the weeks parameter", async () => {
    authenticate();

    const body = statsStreakResponseSchema.parse(
      await (await get("/v1/stats/streak?weeks=4")).json(),
    );

    expect(body.days).toHaveLength(28);
  });

  it("should reject a window beyond a year", async () => {
    authenticate();

    expect((await get("/v1/stats/streak?weeks=54")).status).toBe(422);
    expect((await get("/v1/stats/streak?weeks=0")).status).toBe(422);
  });

  it("should return zero streaks without any workout", async () => {
    authenticate();

    const body = statsStreakResponseSchema.parse(await (await get("/v1/stats/streak")).json());

    expect(body.currentWeeks).toBe(0);
    expect(body.longestWeeks).toBe(0);
  });
});

describe("GET /v1/stats/records", () => {
  const recordRow = {
    id: "prc_1",
    type: "BEST_1RM",
    value: dec(120),
    reps: 5,
    weightKg: dec(100),
    achievedAt: new Date("2026-08-01T18:00:00.000Z"),
    workoutId: "wkt_1",
    exercise: {
      id: "exo_1",
      name: "Barbell bench press",
      translations: [{ locale: "fr", name: "Développé couché" }],
    },
  };

  it("should serialise decimals as strings and localise the exercise name", async () => {
    authenticate();
    findManyRecords.mockResolvedValue([recordRow]);

    const body = statsRecordsResponseSchema.parse(await (await get("/v1/stats/records")).json());

    expect(body.data[0]?.value).toBe("120.00");
    expect(body.data[0]?.weightKg).toBe("100.00");
    // Le nom canonique du dataset est anglais : l'afficher tel quel donnerait
    // « Barbell bench press » dans une interface française.
    expect(body.data[0]?.exercise.name).toBe("Développé couché");
  });

  it("should fall back to the canonical name when no translation matches", async () => {
    authenticate();
    findManyRecords.mockResolvedValue([
      { ...recordRow, exercise: { ...recordRow.exercise, translations: [] } },
    ]);

    const body = statsRecordsResponseSchema.parse(await (await get("/v1/stats/records")).json());

    expect(body.data[0]?.exercise.name).toBe("Barbell bench press");
  });

  it("should default to ten records and cap the limit", async () => {
    authenticate();

    await get("/v1/stats/records");
    expect(findManyRecords.mock.calls[0]?.[0]?.take).toBe(10);

    expect((await get("/v1/stats/records?limit=51")).status).toBe(422);
  });

  it("should only read the records of the session user", async () => {
    authenticate();

    await get("/v1/stats/records");

    expect(findManyRecords.mock.calls[0]?.[0]?.where).toEqual({ userId: "usr_1" });
  });

  /** Le record survit à la suppression de sa séance : il reste vrai, on perd le lien. */
  it("should accept a record whose workout was deleted", async () => {
    authenticate();
    findManyRecords.mockResolvedValue([{ ...recordRow, workoutId: null, weightKg: null }]);

    const body = statsRecordsResponseSchema.parse(await (await get("/v1/stats/records")).json());

    expect(body.data[0]?.workoutId).toBeNull();
    expect(body.data[0]?.weightKg).toBeNull();
  });
});
