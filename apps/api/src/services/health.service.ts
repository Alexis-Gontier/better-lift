import { CORE_VERSION } from "@better-lift/core";
import { checkDatabaseConnection } from "@better-lift/db";
import { type HealthResponse, type VersionResponse } from "@better-lift/validators";

import { env } from "../lib/env.js";

/**
 * Les services portent la logique et ne connaissent jamais le contexte Hono :
 * ils sont testables directement, sans serveur (doc 02).
 */
const startedAt = Date.now();

function uptimeSec(): number {
  return Math.floor((Date.now() - startedAt) / 1000);
}

export async function getHealth(): Promise<HealthResponse> {
  const databaseUp = await checkDatabaseConnection();

  return {
    status: databaseUp ? "ok" : "degraded",
    version: env.APP_VERSION,
    db: databaseUp ? "ok" : "down",
    uptimeSec: uptimeSec(),
  };
}

export function getVersion(): VersionResponse {
  return {
    api: env.APP_VERSION,
    // Prouve que la logique métier partagée est bien celle déployée : dans un
    // monorepo, le numéro de l'API ne le dit pas.
    core: CORE_VERSION,
  };
}
