import { describe, expect, it } from "vitest";

import { $Enums } from "@better-lift/db";
import { bodyPartSchema, exerciseTypeSchema, localeSchema } from "@better-lift/validators";

/**
 * `packages/validators` redéclare les énumérations du schéma Prisma : le web et
 * le mobile le consomment et n'ont pas le droit de dépendre de
 * `@better-lift/db` (règle non négociable n°1).
 *
 * Cette duplication n'est tenable que surveillée. Ces tests sont le seul
 * endroit du dépôt qui voit les deux côtés à la fois — l'API. Sans eux, ajouter
 * une valeur au schéma Prisma produirait une API qui rejette en 422 une valeur
 * pourtant valide en base, sans que rien ne le signale.
 */
describe("alignement des énumérations avec Prisma", () => {
  it("should expose exactly the BodyPart values declared in the schema", () => {
    expect([...bodyPartSchema.options].sort()).toEqual(Object.values($Enums.BodyPart).sort());
  });

  it("should expose exactly the ExerciseType values declared in the schema", () => {
    expect([...exerciseTypeSchema.options].sort()).toEqual(
      Object.values($Enums.ExerciseType).sort(),
    );
  });
});

describe("locales servies", () => {
  /**
   * Le service enracine sa requête sur `ExerciseTranslation` filtrée par
   * locale : un exercice sans traduction dans la locale demandée serait
   * **invisible** au catalogue. Le seed écrit `fr` et `en` pour tous les
   * exercices ; ce test fige le lien entre les deux, pour qu'ajouter une locale
   * au contrat sans l'ajouter au seed ne passe pas inaperçu.
   */
  it("should only serve locales that the seed populates for every exercise", () => {
    expect([...localeSchema.options].sort()).toEqual(["en", "fr"]);
  });
});
