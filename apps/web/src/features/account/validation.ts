import { MAX_REST_SEC, MIN_REST_SEC } from "@better-lift/validators";

/**
 * Validation des champs de réglages, côté client.
 *
 * Elle **double** celle de l'API, elle ne la remplace pas : le serveur reste
 * seul juge (`updateMeSchema` est `.strict()`). Son intérêt est le délai — dire
 * « trois caractères minimum » à la frappe plutôt qu'après un aller-retour.
 *
 * Les messages reprennent ceux des schémas partagés quand ils existent, pour
 * qu'une même règle ne s'énonce pas de deux façons selon qu'elle a été
 * détectée ici ou là-bas.
 *
 * Fonctions pures, donc testables sans rendu : c'est la seule partie de ces
 * écrans qui puisse être fausse en silence.
 */

/** Bornes reprises de `updateMeSchema`, source de vérité du contrat. */
export const MAX_NAME_LENGTH = 100;
const MIN_USERNAME_LENGTH = 3;
const MAX_USERNAME_LENGTH = 30;
export const MAX_BIO_LENGTH = 300;

export function validateDisplayName(value: string): string | null {
  const trimmed = value.trim();

  if (trimmed.length === 0) {
    return "Le nom ne peut pas être vide.";
  }

  if (trimmed.length > MAX_NAME_LENGTH) {
    return `${MAX_NAME_LENGTH} caractères au maximum.`;
  }

  return null;
}

/**
 * Le pseudo est facultatif : un champ vidé **efface** le pseudo, ce que l'API
 * exprime par `null`. C'est pourquoi une chaîne vide n'est pas une erreur ici,
 * alors qu'un pseudo trop court en est une.
 */
export function validateUsername(value: string): string | null {
  const trimmed = value.trim();

  if (trimmed.length === 0) {
    return null;
  }

  if (trimmed.length < MIN_USERNAME_LENGTH) {
    return `${MIN_USERNAME_LENGTH} caractères au minimum.`;
  }

  if (trimmed.length > MAX_USERNAME_LENGTH) {
    return `${MAX_USERNAME_LENGTH} caractères au maximum.`;
  }

  if (!/^[a-z0-9_-]+$/.test(trimmed)) {
    return "Le pseudo n'accepte que des minuscules, des chiffres, un tiret ou un tiret bas.";
  }

  return null;
}

export function validateBio(value: string): string | null {
  return value.trim().length > MAX_BIO_LENGTH ? `${MAX_BIO_LENGTH} caractères au maximum.` : null;
}

export function validateRestSec(value: number): string | null {
  if (!Number.isInteger(value)) {
    return "Une durée en secondes, sans décimale.";
  }

  if (value < MIN_REST_SEC || value > MAX_REST_SEC) {
    return `Entre ${MIN_REST_SEC} secondes et ${MAX_REST_SEC / 60} minutes.`;
  }

  return null;
}

/**
 * Champ texte facultatif : `null` pour l'effacer, la valeur nettoyée sinon.
 *
 * L'API distingue « absent » (ne pas toucher) de `null` (effacer), et une
 * chaîne vide ne dirait ni l'un ni l'autre — elle passerait la validation de
 * longueur et enregistrerait un pseudo vide.
 */
export function emptyToNull(value: string): string | null {
  const trimmed = value.trim();
  return trimmed.length === 0 ? null : trimmed;
}
