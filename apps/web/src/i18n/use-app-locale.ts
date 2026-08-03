"use client";

import { useQuery } from "@tanstack/react-query";

import { queryKeys } from "@better-lift/api-client";
import { type Locale } from "@better-lift/validators";

import { apiClient } from "@/lib/api";

/**
 * La langue du profil **si elle est déjà connue**, sans jamais la demander.
 *
 * `enabled: false` est le point important : le provider de langue est monté à
 * la racine, donc sur la page marketing et sur les écrans d'authentification,
 * où il n'y a pas de session. Une requête y répondrait 401 à chaque
 * chargement, pour une information dont on sait d'avance qu'elle n'existe pas.
 *
 * Le hook reste néanmoins **abonné au cache** : quand un écran connecté charge
 * `GET /v1/me`, la valeur arrive ici et l'interface bascule dans la langue du
 * compte. C'est ce qui distingue cette forme d'une simple lecture de cache, qui
 * ne redéclencherait aucun rendu.
 *
 * Renvoie `null` — et non la locale par défaut — tant que le profil est
 * inconnu : c'est ce qui laisse la langue du navigateur décider avant la
 * connexion (`resolveLocale`).
 */
export function useOptionalProfileLocale(): Locale | null {
  const { data } = useQuery({
    queryKey: queryKeys.me,
    queryFn: ({ signal }) => apiClient.getMe(signal),
    enabled: false,
  });

  return data?.locale ?? null;
}
