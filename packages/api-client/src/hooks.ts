import { type UseQueryResult, useQuery } from "@tanstack/react-query";

import { type HealthResponse, type VersionResponse } from "@better-lift/validators";

import { type ApiClient } from "./client.js";

/**
 * Clés de cache centralisées : les dériver au cas par cas dans les écrans
 * garantit des invalidations manquées.
 */
export const queryKeys = {
  health: ["health"] as const,
  version: ["version"] as const,
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

export function useVersion(client: ApiClient): UseQueryResult<VersionResponse, Error> {
  return useQuery({
    queryKey: queryKeys.version,
    queryFn: ({ signal }) => client.getVersion(signal),
    // Les versions ne changent qu'au déploiement.
    staleTime: 5 * 60_000,
  });
}
