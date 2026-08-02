"use client";

import { useMe } from "@better-lift/api-client";
import { DEFAULT_LOCALE, type Locale } from "@better-lift/validators";

import { apiClient } from "@/lib/api";

/**
 * Locale du **profil**, pas celle du navigateur (doc 05) : quelqu'un qui a
 * choisi le français depuis un navigateur anglais attend du français partout,
 * y compris dans les noms d'exercices que sert l'API.
 *
 * Le repli sur `DEFAULT_LOCALE` pendant le chargement de `GET /v1/me` est
 * assumé : c'est la même valeur que celle que l'API appliquerait d'elle-même.
 * Pour un profil en anglais, la première page peut donc arriver en français
 * puis être remplacée — le coût est une requête, contre un écran bloqué en
 * attente du profil pour tout le monde.
 */
export function useProfileLocale(): Locale {
  return useMe(apiClient).data?.locale ?? DEFAULT_LOCALE;
}
