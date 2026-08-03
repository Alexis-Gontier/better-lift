import { z } from "zod";

import { localeSchema } from "./locale.js";

/**
 * Contrats de `GET /v1/me` et `PATCH /v1/me` (doc 04, § Compte).
 */

export const unitSystemSchema = z.enum(["METRIC", "IMPERIAL"]);

export const visibilitySchema = z.enum(["PRIVATE", "FOLLOWERS", "PUBLIC"]);

/** Bornes du repos par défaut : 10 s à 1 h. Au-delà ce n'est plus un repos. */
export const MIN_REST_SEC = 10;
export const MAX_REST_SEC = 3600;

/**
 * Le pseudo est le seul champ de profil soumis à unicité, d'où sa forme
 * contrainte : il finira dans une URL le jour où les profils publics
 * existeront (D15), et un pseudo avec un espace ou un accent y serait pénible.
 */
export const usernameSchema = z
  .string()
  .trim()
  .min(3)
  .max(30)
  .regex(
    /^[a-z0-9_-]+$/,
    "Le pseudo n'accepte que des minuscules, des chiffres, un tiret ou un tiret bas.",
  );

/**
 * Ce que l'API expose de l'utilisateur connecté : l'identité issue de Better
 * Auth, plus les préférences qui pilotent l'affichage côté client.
 *
 * `unitSystem` mérite d'être lu avec attention : c'est une préférence
 * **d'affichage**. Les charges restent en kg dans l'API et en base (règle non
 * négociable n°3) ; la conversion est l'affaire du client, via un composant
 * unique, jamais à la main dans un écran.
 */
export const currentUserSchema = z.object({
  id: z.string().min(1),
  email: z.email(),
  name: z.string(),
  emailVerified: z.boolean(),
  image: z.url().nullable(),
  createdAt: z.iso.datetime(),

  username: z.string().nullable(),
  bio: z.string().nullable(),
  unitSystem: unitSystemSchema,
  locale: localeSchema,
  timezone: z.string(),
  defaultRestSec: z.number().int(),
  defaultVisibility: visibilitySchema,
  /** Nul tant que le parcours d'accueil n'a pas eu lieu. */
  onboardedAt: z.iso.datetime().nullable(),
});

/**
 * Mise à jour partielle du profil.
 *
 * `.strict()` est délibéré ici, alors que l'API tolère les champs inconnus
 * ailleurs (doc 04) : sur une écriture, un champ mal orthographié serait
 * silencieusement ignoré et l'utilisateur croirait avoir enregistré. Mieux vaut
 * un 422 explicite. La tolérance vaut pour les lectures et les vieux clients,
 * pas pour un formulaire de réglages.
 *
 * `username` et `bio` acceptent `null` pour être effacés — ce qu'une simple
 * absence de clé ne permettrait pas d'exprimer.
 */
export const updateMeSchema = z
  .object({
    name: z.string().trim().min(1).max(100),
    username: usernameSchema.nullable(),
    bio: z.string().trim().max(300).nullable(),
    unitSystem: unitSystemSchema,
    locale: localeSchema,
    timezone: z.string().min(1).max(64),
    defaultRestSec: z.number().int().min(MIN_REST_SEC).max(MAX_REST_SEC),
    defaultVisibility: visibilitySchema,
  })
  .partial()
  .strict()
  // Un PATCH vide n'est pas une erreur de validation en soi, mais il trahit
  // presque toujours un bug côté client : mieux vaut le dire.
  .refine((value) => Object.keys(value).length > 0, {
    message: "Au moins un champ doit être fourni.",
  });

/**
 * Confirmation de suppression de compte (doc 04, § Compte).
 *
 * `password` est **facultatif dans le schéma, exigé par le service** dès que le
 * compte porte un mot de passe : un compte créé par GitHub seul (D26) n'en a
 * aucun à confirmer, et le rendre obligatoire ici l'enfermerait dehors. Le
 * service tranche, parce que lui seul sait ce que le compte possède.
 *
 * Le corps reste **requis**, même vide : c'est la seule façon de distinguer un
 * client qui n'a rien à confirmer d'un client qui a oublié le champ.
 */
export const deleteAccountSchema = z
  .object({
    password: z.string().min(1, "Le mot de passe est requis.").max(128).optional(),
  })
  .strict();

export type UnitSystem = z.infer<typeof unitSystemSchema>;
export type Visibility = z.infer<typeof visibilitySchema>;
export type CurrentUser = z.infer<typeof currentUserSchema>;
export type UpdateMeInput = z.infer<typeof updateMeSchema>;
export type DeleteAccountInput = z.infer<typeof deleteAccountSchema>;
