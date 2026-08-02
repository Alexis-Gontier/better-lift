"use client";

import { useMe } from "@better-lift/api-client";

import { apiClient } from "@/lib/api";

/**
 * Fuseau du **profil**, pour découper l'historique en jours.
 *
 * Le fuseau du navigateur ne conviendrait pas : quelqu'un qui consulte son
 * historique depuis un aéroport verrait ses séances du soir sauter au
 * lendemain. Le calendrier doit montrer les jours tels qu'ils ont été vécus,
 * pas tels qu'ils sont perçus depuis l'endroit d'où l'on regarde.
 *
 * Repli sur `UTC` pendant le chargement de `GET /v1/me` : c'est le fuseau des
 * données elles-mêmes, donc le seul repli qui ne déplace rien de plus.
 */
export function useProfileTimezone(): string {
  return useMe(apiClient).data?.timezone ?? "UTC";
}
