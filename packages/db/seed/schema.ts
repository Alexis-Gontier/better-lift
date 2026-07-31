import { z } from "zod";

/**
 * Schéma du dataset vendorisé (doc 08). Toute divergence amont doit faire
 * échouer le seed plutôt que d'insérer des données partielles.
 */
const sourceExerciseSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  category: z.string().nullish(),
  body_part: z.string().min(1),
  equipment: z.string().min(1),
  target: z.string().min(1),
  muscle_group: z.string().nullish(),
  secondary_muscles: z.array(z.string()).default([]),
  instruction_steps: z.record(z.string(), z.array(z.string())).default({}),
  media_id: z.string().nullish(),
  image: z.string().nullish(),
  gif_url: z.string().nullish(),
  // L'attribution Gym visual est obligatoire : elle doit être affichée partout
  // où le média apparaît (D17), donc elle ne peut pas manquer en base.
  attribution: z.string().min(1),
});

export type SourceExercise = z.infer<typeof sourceExerciseSchema>;

export const sourceDatasetSchema = z.array(sourceExerciseSchema).min(1);
