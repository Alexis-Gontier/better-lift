import { z } from "zod";

/**
 * Les préférences du compte (D129) : ce qui suit l'utilisateur d'un appareil à
 * l'autre. Le thème et les vibrations, réglages d'appareil, restent sur le
 * téléphone. `null` : pas d'objectif, ou le repos par défaut de l'application.
 */
export const preferences = z.object({
  /** Les séances visées par semaine (D128). */
  objectifHebdo: z.number().int().min(1).max(7).nullable(),
  /** Le repos des exercices qui n'en ont pas, en secondes ; mêmes bornes qu'une routine. */
  reposDefautSec: z.number().int().min(0).max(3600).nullable(),
});

export type Preferences = z.infer<typeof preferences>;

/** Un compte qui n'a encore rien réglé. */
export const PREFERENCES_DEFAUT: Preferences = { objectifHebdo: null, reposDefautSec: null };
