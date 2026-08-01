import { type ZodError } from "zod";

import { ApiError } from "./errors.js";

/**
 * Traduit un échec de validation `@hono/zod-openapi` en erreur du projet.
 *
 * Sans ce crochet, la bibliothèque répond **400 avec son propre format**, alors
 * que le contrat de la doc 04 impose `VALIDATION_FAILED` en **422** dans
 * l'enveloppe `{ error: { code, message, details } }`. Un client qui aiguille
 * sur le code d'erreur ne verrait jamais passer les erreurs de validation.
 *
 * Il doit être passé à **chaque** `OpenAPIHono` qui valide des entrées :
 * `defaultHook` ne se transmet pas aux routeurs montés.
 */

/**
 * Forme minimale de ce que la bibliothèque passe au crochet. La déclarer ainsi
 * plutôt que d'importer son `Hook<…>` — générique sur le schéma, l'environnement
 * et le chemin de chaque route — évite le `any` que ces quatre paramètres
 * imposeraient à un crochet partagé. Le type réel reste assignable : il ne fait
 * qu'ajouter des champs.
 */
type ValidationResult = { success: true } | { success: false; error: ZodError };

export function validationHook(result: ValidationResult): void {
  if (result.success) {
    return;
  }

  throw new ApiError(
    "VALIDATION_FAILED",
    "Paramètres invalides.",
    result.error.issues.map((issue) => ({
      path: issue.path.join("."),
      message: issue.message,
    })),
  );
}
