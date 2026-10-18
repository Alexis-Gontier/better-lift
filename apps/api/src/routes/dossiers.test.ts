import type { Dossier } from "@better-lift/shared";
import { Hono } from "hono";
import { describe, expect, it } from "vitest";
import type { LireSession } from "../middlewares/session.js";
import { type DepotDossiers, NomPris } from "../services/dossiers.js";
import { routesDossiers } from "./dossiers.js";

/** Un dépôt en mémoire, avec la règle du vrai : un nom par compte, celui d'autrui introuvable. */
function fauxDepot(): DepotDossiers {
  const dossiers = new Map<string, Dossier & { userId: string }>();
  let suivant = 1;
  const pris = (userId: string, nom: string, sauf?: string) =>
    [...dossiers.values()].some((d) => d.userId === userId && d.nom === nom && d.id !== sauf);
  return {
    async lister(userId) {
      return [...dossiers.values()]
        .filter((d) => d.userId === userId)
        .map(({ id, nom }) => ({ id, nom }));
    },
    async creer(userId, nom) {
      if (pris(userId, nom)) throw new NomPris();
      const id = `d${suivant++}`;
      dossiers.set(id, { id, nom, userId });
      return id;
    },
    async renommer(userId, id, nom) {
      const d = dossiers.get(id);
      if (!d || d.userId !== userId) return false;
      if (pris(userId, nom, id)) throw new NomPris();
      d.nom = nom;
      return true;
    },
    async supprimer(userId, id) {
      const d = dossiers.get(id);
      return !!d && d.userId === userId && dossiers.delete(id);
    },
    async ordonner(userId, ids) {
      return ids.every((id) => dossiers.get(id)?.userId === userId);
    },
  };
}

/** La session se choisit par un en-tête : « x-test-user: alice ». */
const lireSession: LireSession = async (h) => {
  const u = h.get("x-test-user");
  return u ? { user: { id: u } } : null;
};

function client() {
  const app = new Hono().route("/dossiers", routesDossiers(fauxDepot(), lireSession));
  return (methode: string, chemin: string, user: string | null, corps?: unknown) =>
    app.request(chemin, {
      method: methode,
      headers: {
        ...(user ? { "x-test-user": user } : {}),
        ...(corps ? { "content-type": "application/json" } : {}),
      },
      ...(corps ? { body: JSON.stringify(corps) } : {}),
    });
}

const creer = async (envoyer: ReturnType<typeof client>, nom: string, user = "alice") =>
  ((await (await envoyer("POST", "/dossiers", user, { nom })).json()) as { id: string }).id;

describe("routes des dossiers (D297)", () => {
  it("rend 401 sans session, sur chaque route", async () => {
    const envoyer = client();
    for (const [m, p, corps] of [
      ["POST", "/dossiers", { nom: "PPL" }],
      ["PATCH", "/dossiers/d1", { nom: "PPL" }],
      ["DELETE", "/dossiers/d1", undefined],
      ["PUT", "/dossiers/ordre", { ids: ["d1"] }],
    ] as const) {
      expect((await envoyer(m, p, null, corps)).status).toBe(401);
    }
  });

  it("crée, renomme, réordonne puis supprime", async () => {
    const envoyer = client();
    const creation = await envoyer("POST", "/dossiers", "alice", { nom: "PPL" });
    expect(creation.status).toBe(201);
    const { id } = (await creation.json()) as { id: string };
    const renommage = await envoyer("PATCH", `/dossiers/${id}`, "alice", { nom: "Push Pull Legs" });
    expect(renommage.status).toBe(200);
    expect((await envoyer("PUT", "/dossiers/ordre", "alice", { ids: [id] })).status).toBe(204);
    expect((await envoyer("DELETE", `/dossiers/${id}`, "alice")).status).toBe(204);
    expect((await envoyer("DELETE", `/dossiers/${id}`, "alice")).status).toBe(404);
  });

  it("rend 409 sur un nom déjà pris, à la création comme au renommage", async () => {
    const envoyer = client();
    await creer(envoyer, "PPL");
    const autre = await creer(envoyer, "Full body");
    const doublon = await envoyer("POST", "/dossiers", "alice", { nom: "PPL" });
    expect(doublon.status).toBe(409);
    expect(await doublon.json()).toEqual({ erreur: "Un dossier porte déjà ce nom." });
    expect((await envoyer("PATCH", `/dossiers/${autre}`, "alice", { nom: "PPL" })).status).toBe(
      409,
    );
  });

  // D53 : le dossier d'autrui est INTROUVABLE, pas interdit.
  it("rend 404, jamais 403, sur le dossier d'un autre", async () => {
    const envoyer = client();
    const id = await creer(envoyer, "PPL");
    expect((await envoyer("PATCH", `/dossiers/${id}`, "bob", { nom: "X" })).status).toBe(404);
    expect((await envoyer("DELETE", `/dossiers/${id}`, "bob")).status).toBe(404);
    expect((await envoyer("PUT", "/dossiers/ordre", "bob", { ids: [id] })).status).toBe(404);
  });

  it("rend 400 sur un nom vide ou un identifiant en double", async () => {
    const envoyer = client();
    expect((await envoyer("POST", "/dossiers", "alice", { nom: " " })).status).toBe(400);
    const id = await creer(envoyer, "PPL");
    expect((await envoyer("PUT", "/dossiers/ordre", "alice", { ids: [id, id] })).status).toBe(400);
  });
});
