import "../env.js";

import { prisma } from "@better-lift/db";
import { Hono } from "hono";

const demarrage = Date.now();

export const health = new Hono().get("/", async (c) => {
  let db = false;
  try {
    await prisma.$queryRaw`SELECT 1`;
    db = true;
  } catch {
    db = false;
  }

  return c.json(
    {
      status: db ? ("ok" as const) : ("degraded" as const),
      version: process.env.npm_package_version ?? "0.0.0",
      db,
      uptimeSec: Math.floor((Date.now() - demarrage) / 1000),
    },
    200,
  );
});
