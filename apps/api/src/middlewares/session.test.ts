import { Hono } from "hono";
import { describe, expect, it } from "vitest";
import { exigerSession, type LireSession } from "./session.js";

const monter = (lire: LireSession) =>
  new Hono().use(exigerSession(lire)).get("/", (c) => c.json({ userId: c.get("userId") }));

describe("exigerSession", () => {
  it("rend 401 sans session", async () => {
    const res = await monter(async () => null).request("/");
    expect(res.status).toBe(401);
  });

  it("pose l'identifiant de l'utilisateur dans le contexte", async () => {
    const res = await monter(async () => ({ user: { id: "u1" } })).request("/");
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ userId: "u1" });
  });

  it("transmet les en-têtes de la requête au lecteur", async () => {
    let cookie: string | null = null;
    await monter(async (h) => {
      cookie = h.get("cookie");
      return null;
    }).request("/", { headers: { cookie: "session=abc" } });
    expect(cookie).toBe("session=abc");
  });
});
