import { prisma } from "../src/client.js";
import { loadSeedEnv } from "./env.js";
import { seedExercises } from "./exercises.js";

/**
 * Seed du catalogue d'exercices.
 *
 * Idempotent : rejouable sans effet de bord, ce qui permet de le lancer en CI
 * et à chaque déploiement (doc 08). Prisma 7 ne le déclenche plus pendant les
 * migrations — il est appelé explicitement par `pnpm db:seed`.
 */
loadSeedEnv();

const startedAt = Date.now();

try {
  const report = await seedExercises();
  const elapsed = ((Date.now() - startedAt) / 1000).toFixed(1);

  console.warn(
    [
      `Seed terminé en ${elapsed}s :`,
      `${report.created} créé(s)`,
      `${report.updated} mis à jour`,
      `${report.unchanged} inchangé(s)`,
      `${report.archived} archivé(s)`,
      `${report.translationsWritten} traduction(s) écrite(s)`,
    ].join(" · "),
  );
} finally {
  await prisma.$disconnect();
}
