/**
 * @better-lift/db — accès aux données.
 *
 * Consommé **uniquement** par apps/api : le web et le mobile passent toujours
 * par l'API (règle non négociable n°1, doc 09 D3).
 */

export { checkDatabaseConnection, prisma } from "./client.js";
export * from "./generated/prisma/client.js";
