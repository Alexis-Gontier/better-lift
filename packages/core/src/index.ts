/**
 * @better-lift/core — logique métier pure.
 *
 * Aucun I/O, aucun React, aucun Prisma (règle non négociable n°9). Consommé
 * par les trois applications : c'est le test réel du partage de code du
 * monorepo.
 */

export * from "./calendar.js";
export * from "./decimal.js";
export * from "./one-rep-max.js";
export * from "./records.js";
export * from "./supersets.js";
export * from "./types.js";
export * from "./units.js";
export * from "./volume.js";

/** Version du socle métier, affichée par `GET /health` pour tracer le déploiement. */
export const CORE_VERSION = "0.0.0";
