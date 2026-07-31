import { PrismaPg } from "@prisma/adapter-pg";

import { PrismaClient } from "./generated/prisma/client.js";

/**
 * Prisma 7 impose un driver adapter : `new PrismaClient()` nu est invalide
 * (doc 10). L'URL runtime est la connexion **poolée** de Neon.
 */
function createPrismaClient(): PrismaClient {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error(
      "DATABASE_URL est absente. Copier .env.example vers .env et renseigner la connexion Neon.",
    );
  }

  return new PrismaClient({
    adapter: new PrismaPg({ connectionString }),
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });
}

/**
 * Singleton : en développement, le rechargement à chaud recrée le module et
 * épuiserait le pool de connexions sans cette mise en cache globale.
 */
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

function getClient(): PrismaClient {
  const existing = globalForPrisma.prisma;

  if (existing) {
    return existing;
  }

  const client = createPrismaClient();

  if (process.env.NODE_ENV !== "production") {
    globalForPrisma.prisma = client;
  }

  return client;
}

/**
 * L'instanciation est **paresseuse** : elle n'a lieu qu'au premier accès, pas
 * à l'import du module.
 *
 * Sans ça, tout consommateur devrait garantir que son chargement de `.env`
 * précède l'import de ce package — une contrainte d'ordre d'imports que le
 * moindre tri automatique casserait silencieusement.
 */
export const prisma: PrismaClient = new Proxy({} as PrismaClient, {
  get(_target, property) {
    const client = getClient();
    const value: unknown = Reflect.get(client, property);

    // Les méthodes sont liées au client réel : les passer telles quelles
    // casserait leurs champs privés.
    return typeof value === "function" ? value.bind(client) : value;
  },
});

/** Sonde de disponibilité utilisée par `GET /health`. */
export async function checkDatabaseConnection(): Promise<boolean> {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return true;
  } catch {
    return false;
  }
}
