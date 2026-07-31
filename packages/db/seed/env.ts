import { config as loadEnv } from "dotenv";

/**
 * Le client Prisma lit `DATABASE_URL` au moment de son import : l'environnement
 * doit donc être chargé **avant**. C'est pour ça que `seed/index.ts` importe le
 * reste dynamiquement, après cet appel.
 */
export function loadSeedEnv(): void {
  loadEnv({ path: [".env", "../../.env"], quiet: true });

  if (!process.env.DATABASE_URL) {
    throw new Error(
      "DATABASE_URL est absente. Copier .env.example vers .env à la racine et renseigner la connexion Neon.",
    );
  }
}
