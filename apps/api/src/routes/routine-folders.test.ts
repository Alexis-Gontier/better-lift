import { beforeEach, describe, expect, it, vi } from "vitest";

import { routineFolderListResponseSchema } from "@better-lift/validators";

const getSession = vi.hoisted(() => vi.fn());
const findManyFolders = vi.hoisted(() => vi.fn());
const findUniqueOrThrowFolder = vi.hoisted(() => vi.fn());
const createFolderRow = vi.hoisted(() => vi.fn());
const updateFolderRow = vi.hoisted(() => vi.fn());
const updateManyFolders = vi.hoisted(() => vi.fn());
const deleteManyFolders = vi.hoisted(() => vi.fn());
const aggregateFolders = vi.hoisted(() => vi.fn());

vi.mock("@better-lift/db", () => {
  const client = {
    routineFolder: {
      findMany: findManyFolders,
      findUniqueOrThrow: findUniqueOrThrowFolder,
      create: createFolderRow,
      update: updateFolderRow,
      updateMany: updateManyFolders,
      deleteMany: deleteManyFolders,
      aggregate: aggregateFolders,
    },
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
  aggregateFolders.mockResolvedValue({ _max: { position: null } });
  findManyFolders.mockResolvedValue([]);
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

function folderRow(overrides: Record<string, unknown> = {}) {
  return {
    id: "fld_1",
    name: "Push Pull Legs",
    position: 0,
    createdAt: new Date("2026-08-01T10:00:00.000Z"),
    updatedAt: new Date("2026-08-01T10:00:00.000Z"),
    _count: { routines: 3 },
    ...overrides,
  };
}

describe("GET /v1/routine-folders", () => {
  it("should return 401 when no session is established", async () => {
    getSession.mockResolvedValue(null);

    expect((await app.request("/v1/routine-folders")).status).toBe(401);
  });

  it("should exclude deleted routines from the count", async () => {
    authenticate();
    findManyFolders.mockResolvedValue([folderRow()]);

    const response = await app.request("/v1/routine-folders");
    const payload = routineFolderListResponseSchema.parse(await response.json());

    expect(payload.data[0]?.routineCount).toBe(3);
    /**
     * Une suppression de routine est logique : la ligne reste en base. Sans ce
     * filtre, un dossier annoncerait trois routines et n'en montrerait qu'une.
     */
    expect(findManyFolders.mock.calls[0]?.[0]?.include?._count).toEqual({
      select: { routines: { where: { deletedAt: null } } },
    });
  });
});

describe("POST /v1/routine-folders", () => {
  it("should place a new folder after the last one", async () => {
    authenticate();
    aggregateFolders.mockResolvedValue({ _max: { position: 4 } });
    createFolderRow.mockResolvedValue(folderRow({ position: 5 }));

    const response = await app.request("/v1/routine-folders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "Prise de masse" }),
    });

    expect(response.status).toBe(201);
    /**
     * `max + 1` et non `count()` : les deux divergent dès qu'un dossier a été
     * supprimé, et deux dossiers à la même position rendent l'ordre instable.
     */
    expect(createFolderRow.mock.calls[0]?.[0]?.data).toMatchObject({
      userId: "usr_1",
      position: 5,
    });
  });

  it("should reject an empty name", async () => {
    authenticate();

    const response = await app.request("/v1/routine-folders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "   " }),
    });

    expect(response.status).toBe(422);
  });
});

describe("PATCH /v1/routine-folders/:id", () => {
  it("should return 404 when the folder belongs to someone else", async () => {
    authenticate();
    updateManyFolders.mockResolvedValue({ count: 0 });

    const response = await app.request("/v1/routine-folders/fld_9", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "Vol" }),
    });

    expect(response.status).toBe(404);
  });

  it("should filter on the owner inside the write itself", async () => {
    authenticate();
    updateManyFolders.mockResolvedValue({ count: 1 });
    findUniqueOrThrowFolder.mockResolvedValue(folderRow({ name: "Renommé" }));

    await app.request("/v1/routine-folders/fld_1", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "Renommé" }),
    });

    // Un `findFirst` suivi d'un `update` laisserait une fenêtre entre la
    // vérification et l'écriture.
    expect(updateManyFolders.mock.calls[0]?.[0]?.where).toEqual({ id: "fld_1", userId: "usr_1" });
  });
});

describe("DELETE /v1/routine-folders/:id", () => {
  it("should return 404 when the folder belongs to someone else", async () => {
    authenticate();
    deleteManyFolders.mockResolvedValue({ count: 0 });

    expect((await app.request("/v1/routine-folders/fld_9", { method: "DELETE" })).status).toBe(404);
  });

  it("should delete the folder itself, never its routines", async () => {
    authenticate();
    deleteManyFolders.mockResolvedValue({ count: 1 });

    const response = await app.request("/v1/routine-folders/fld_1", { method: "DELETE" });

    expect(response.status).toBe(204);
    /**
     * Aucune écriture sur les routines : c'est `onDelete: SetNull` en base qui
     * les fait remonter à la racine. Une garantie qu'aucun oubli d'appel ne
     * peut contourner.
     */
    expect(deleteManyFolders.mock.calls[0]?.[0]).toEqual({
      where: { id: "fld_1", userId: "usr_1" },
    });
  });
});

describe("POST /v1/routine-folders/reorder", () => {
  it("should ignore identifiers that are not the caller's", async () => {
    authenticate();
    findManyFolders.mockResolvedValueOnce([{ id: "fld_1" }, { id: "fld_2" }]);
    updateFolderRow.mockResolvedValue({});
    findManyFolders.mockResolvedValueOnce([]);

    const response = await app.request("/v1/routine-folders/reorder", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids: ["fld_2", "fld_dautrui", "fld_1"] }),
    });

    expect(response.status).toBe(200);
    expect(updateFolderRow.mock.calls.map((call) => call[0])).toEqual([
      { where: { id: "fld_2" }, data: { position: 0 } },
      { where: { id: "fld_1" }, data: { position: 1 } },
    ]);
  });

  it("should reject an empty list", async () => {
    authenticate();

    const response = await app.request("/v1/routine-folders/reorder", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids: [] }),
    });

    expect(response.status).toBe(422);
  });
});
