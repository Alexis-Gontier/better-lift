import {
  type InfiniteData,
  type UseInfiniteQueryResult,
  type UseMutationResult,
  type UseQueryResult,
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import {
  type CurrentUser,
  type ExerciseDetail,
  type ExerciseListQuery,
  type ExerciseListResponse,
  type HealthResponse,
  type Locale,
  type UpdateMeInput,
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
  /**
   * Les filtres font partie de la clé : deux recherches différentes sont deux
   * entrées de cache, et changer un filtre ne doit pas afficher brièvement le
   * résultat du précédent.
   */
  exercises: (query: Partial<ExerciseListQuery> = {}) => ["exercises", query] as const,
  exercise: (id: string, locale?: Locale) => ["exercise", id, locale ?? null] as const,
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

/**
 * Mise à jour du profil.
 *
 * Le cache de `me` est écrit directement depuis la réponse plutôt
 * qu'invalidé : l'API renvoie le profil complet après écriture, refaire un
 * `GET` derrière serait un aller-retour pour une donnée qu'on tient déjà — et
 * l'écran clignoterait entre-temps.
 */
export function useUpdateMe(
  client: ApiClient,
): UseMutationResult<CurrentUser, Error, UpdateMeInput> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: UpdateMeInput) => client.updateMe(input),
    onSuccess: (user) => {
      queryClient.setQueryData(queryKeys.me, user);
    },
  });
}

/**
 * Catalogue paginé. `useInfiniteQuery` plutôt que `useQuery` parce que la
 * pagination est par curseur : on empile les pages, on ne saute pas à la
 * énième — c'est précisément ce qu'un curseur ne permet pas.
 */
export function useExercises(
  client: ApiClient,
  query: Partial<ExerciseListQuery> = {},
): UseInfiniteQueryResult<InfiniteData<ExerciseListResponse>, Error> {
  return useInfiniteQuery({
    queryKey: queryKeys.exercises(query),
    queryFn: ({ pageParam, signal }) =>
      client.listExercises({ ...query, cursor: pageParam }, signal),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    // Le catalogue ne bouge qu'au déploiement d'un nouveau seed : le
    // rafraîchir au moindre retour de focus serait du trafic pur.
    staleTime: 5 * 60_000,
  });
}

export function useExercise(
  client: ApiClient,
  id: string,
  locale?: Locale,
): UseQueryResult<ExerciseDetail, Error> {
  return useQuery({
    queryKey: queryKeys.exercise(id, locale),
    queryFn: ({ signal }) => client.getExercise(id, locale, signal),
    staleTime: 5 * 60_000,
    // Un 404 est une réponse, pas une panne.
    retry: false,
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
