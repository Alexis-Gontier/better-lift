import { type UseQueryResult, useQuery } from "@tanstack/react-query";

import {
  type CurrentUser,
  type HealthResponse,
  type VersionResponse,
} from "@better-lift/validators";

import { type ApiClient } from "./client.js";

/**
 * Clés de cache centralisées : les dériver au cas par cas dans les écrans
 * garantit des invalidations manquées.
 */
export const queryKeys = {
  health: ["health"] as const,
  version: ["version"] as const,
  me: ["me"] as const,
};

export function useHealth(client: ApiClient): UseQueryResult<HealthResponse, Error> {
  return useQuery({
    queryKey: queryKeys.health,
    queryFn: ({ signal }) => client.getHealth(signal),
    // L'état de l'API se périme vite : inutile de servir une valeur de cache
    // rassurante alors que le service vient de tomber.
    staleTime: 5_000,
    retry: 1,
  });
}

/**
 * Utilisateur de la session courante, vu **par l'API** et non par le client
 * d'authentification : c'est ce qui prouve que le cookie voyage jusqu'à une
 * route protégée, pas seulement qu'une session existe côté navigateur.
 */
export function useMe(client: ApiClient): UseQueryResult<CurrentUser, Error> {
  return useQuery({
    queryKey: queryKeys.me,
    queryFn: ({ signal }) => client.getMe(signal),
    // Un 401 est une réponse, pas une panne : le réessayer n'apporte rien.
    retry: false,
    staleTime: 30_000,
  });
}

export function useVersion(client: ApiClient): UseQueryResult<VersionResponse, Error> {
  return useQuery({
    queryKey: queryKeys.version,
    queryFn: ({ signal }) => client.getVersion(signal),
    // Les versions ne changent qu'au déploiement.
    staleTime: 5 * 60_000,
  });
}
