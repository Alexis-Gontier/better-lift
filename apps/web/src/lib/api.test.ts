import { describe, expect, it } from "vitest";
import { ErreurApi, lire } from "./api";

/** Comme une réponse RPC : `ok` est un littéral, qui discrimine succès et échec. */
type Reponse =
  | { ok: true; status: number; json: () => Promise<unknown> }
  | { ok: false; status: number; json: () => Promise<unknown> };

const reponse = (status: number, corps: unknown) =>
  ({ ok: status < 400, status, json: async () => corps }) as Reponse;

describe("lire (D300)", () => {
  it("rend la réponse ok telle quelle", async () => {
    const res = await lire(async () => reponse(200, { a: 1 }), "défaut");
    expect(await res.json()).toEqual({ a: 1 });
  });

  it("lève une ErreurApi avec le message de { erreur } et le statut", async () => {
    const echec = lire(async () => reponse(404, { erreur: "Routine introuvable." }), "défaut");
    await expect(echec).rejects.toBeInstanceOf(ErreurApi);
    await expect(echec).rejects.toMatchObject({ message: "Routine introuvable.", statut: 404 });
  });

  it("prend le message par défaut sans corps lisible", async () => {
    const res = {
      ok: false,
      status: 500,
      json: async () => {
        throw new Error("pas du JSON");
      },
    };
    await expect(lire(async () => res, "Échec.")).rejects.toMatchObject({
      message: "Échec.",
      statut: 500,
    });
  });

  it("traduit un réseau coupé, statut 0", async () => {
    const coupe = async (): Promise<Reponse> => {
      throw new TypeError("Failed to fetch");
    };
    await expect(lire(coupe, "défaut")).rejects.toMatchObject({
      statut: 0,
      message: expect.stringContaining("injoignable"),
    });
  });
});
