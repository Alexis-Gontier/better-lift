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
  type CreateExerciseInput,
  type CurrentUser,
  type ExerciseDetail,
  type ExerciseListQuery,
  type ExerciseListResponse,
  type HealthResponse,
  type Locale,
  type RoutineDetail,
  type RoutineFolder,
  type RoutineFolderInput,
  type RoutineListQuery,
  type RoutineStructureInput,
  type RoutineSummary,
  type UpdateExerciseInput,
  type UpdateMeInput,
  type UpdateRoutineInput,
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
  /**
   * Racine des listes. Une invalidation doit porter sur **toutes** les
   * combinaisons de filtres : créer un exercice le fait entrer dans des listes
   * dont on ne connaît pas les filtres depuis la mutation.
   */
  exercisesAll: ["exercises"] as const,
  exercise: (id: string, locale?: Locale) => ["exercise", id, locale ?? null] as const,

  routineFolders: ["routine-folders"] as const,
  routines: (query: Partial<RoutineListQuery> = {}) => ["routines", query] as const,
  /** Racine des listes de routines : cible des invalidations après écriture. */
  routinesAll: ["routines"] as const,
  routine: (id: string, locale?: Locale) => ["routine", id, locale ?? null] as const,
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

/**
 * Création d'un exercice personnalisé.
 *
 * Toutes les listes sont invalidées, quels que soient leurs filtres : le
 * nouvel exercice a de bonnes chances d'appartenir à plusieurs d'entre elles,
 * et la mutation n'a aucun moyen de savoir lesquelles sont en cache. Le détail
 * est écrit directement depuis la réponse, qui est déjà la fiche complète.
 */
export function useCreateExercise(
  client: ApiClient,
  locale?: Locale,
): UseMutationResult<ExerciseDetail, Error, CreateExerciseInput> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateExerciseInput) => client.createExercise(input, locale),
    onSuccess: async (exercise) => {
      queryClient.setQueryData(queryKeys.exercise(exercise.id, exercise.locale), exercise);
      await queryClient.invalidateQueries({ queryKey: queryKeys.exercisesAll });
    },
  });
}

export function useUpdateExercise(
  client: ApiClient,
  locale?: Locale,
): UseMutationResult<ExerciseDetail, Error, { id: string; input: UpdateExerciseInput }> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, input }) => client.updateExercise(id, input, locale),
    onSuccess: async (exercise) => {
      queryClient.setQueryData(queryKeys.exercise(exercise.id, exercise.locale), exercise);
      // Un renommage change la place de l'exercice dans un tri alphabétique :
      // remplacer la fiche sans réinvalider les listes les laisserait mal
      // ordonnées.
      await queryClient.invalidateQueries({ queryKey: queryKeys.exercisesAll });
    },
  });
}

/**
 * Archivage. La fiche est **retirée du cache** plutôt que mise à jour : un
 * exercice archivé répond désormais 404, et garder sa dernière version en cache
 * ferait afficher une fiche qui n'existe plus.
 */
export function useArchiveExercise(client: ApiClient): UseMutationResult<void, Error, string> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => client.archiveExercise(id),
    onSuccess: async (_result, id) => {
      queryClient.removeQueries({ queryKey: ["exercise", id] });
      await queryClient.invalidateQueries({ queryKey: queryKeys.exercisesAll });
    },
  });
}

// ── Routines ──────────────────────────────────────────────────────────────

/**
 * Après toute écriture sur une routine ou un dossier, **les deux** familles de
 * listes sont invalidées.
 *
 * Elles sont couplées plus qu'il n'y paraît : déplacer une routine change le
 * `routineCount` de deux dossiers, en supprimer une change celui d'un seul, et
 * supprimer un dossier renvoie ses routines à la racine. Invalider finement
 * demanderait de rejouer cette logique côté client, pour économiser une requête
 * sur des listes qui tiennent à l'écran.
 */
async function invalidateRoutineViews(queryClient: ReturnType<typeof useQueryClient>) {
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: queryKeys.routinesAll }),
    queryClient.invalidateQueries({ queryKey: queryKeys.routineFolders }),
  ]);
}

export function useRoutineFolders(client: ApiClient): UseQueryResult<RoutineFolder[], Error> {
  return useQuery({
    queryKey: queryKeys.routineFolders,
    queryFn: ({ signal }) => client.listRoutineFolders(signal),
    staleTime: 30_000,
  });
}

export function useRoutines(
  client: ApiClient,
  query: Partial<RoutineListQuery> = {},
): UseQueryResult<RoutineSummary[], Error> {
  return useQuery({
    queryKey: queryKeys.routines(query),
    queryFn: ({ signal }) => client.listRoutines(query, signal),
    staleTime: 30_000,
  });
}

export function useRoutine(
  client: ApiClient,
  id: string,
  locale?: Locale,
): UseQueryResult<RoutineDetail, Error> {
  return useQuery({
    queryKey: queryKeys.routine(id, locale),
    queryFn: ({ signal }) => client.getRoutine(id, locale, signal),
    // Un 404 est une réponse, pas une panne.
    retry: false,
  });
}

export function useCreateRoutineFolder(
  client: ApiClient,
): UseMutationResult<RoutineFolder, Error, RoutineFolderInput> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: RoutineFolderInput) => client.createRoutineFolder(input),
    onSuccess: () => invalidateRoutineViews(queryClient),
  });
}

export function useUpdateRoutineFolder(
  client: ApiClient,
): UseMutationResult<RoutineFolder, Error, { id: string; input: RoutineFolderInput }> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, input }) => client.updateRoutineFolder(id, input),
    onSuccess: () => invalidateRoutineViews(queryClient),
  });
}

export function useDeleteRoutineFolder(client: ApiClient): UseMutationResult<void, Error, string> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => client.deleteRoutineFolder(id),
    // Les routines du dossier remontent à la racine : leur `folderId` a changé
    // côté serveur, les listes en cache sont périmées.
    onSuccess: () => invalidateRoutineViews(queryClient),
  });
}

export function useReorderRoutineFolders(
  client: ApiClient,
): UseMutationResult<RoutineFolder[], Error, string[]> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (ids: string[]) => client.reorderRoutineFolders(ids),
    onSuccess: (folders) => {
      // La réponse **est** la liste réordonnée : la réécrire évite un
      // aller-retour et le clignotement d'un rechargement après un glisser.
      queryClient.setQueryData(queryKeys.routineFolders, folders);
    },
  });
}

export function useCreateRoutine(
  client: ApiClient,
  locale?: Locale,
): UseMutationResult<RoutineDetail, Error, RoutineStructureInput> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: RoutineStructureInput) => client.createRoutine(input, locale),
    onSuccess: async (routine) => {
      queryClient.setQueryData(queryKeys.routine(routine.id, locale), routine);
      await invalidateRoutineViews(queryClient);
    },
  });
}

/** `PUT` : l'éditeur envoie son brouillon complet, le serveur remplace tout. */
export function useReplaceRoutine(
  client: ApiClient,
  locale?: Locale,
): UseMutationResult<RoutineDetail, Error, { id: string; input: RoutineStructureInput }> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, input }) => client.replaceRoutine(id, input, locale),
    onSuccess: async (routine) => {
      queryClient.setQueryData(queryKeys.routine(routine.id, locale), routine);
      await invalidateRoutineViews(queryClient);
    },
  });
}

export function useUpdateRoutine(
  client: ApiClient,
  locale?: Locale,
): UseMutationResult<RoutineDetail, Error, { id: string; input: UpdateRoutineInput }> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, input }) => client.updateRoutine(id, input, locale),
    onSuccess: async (routine) => {
      queryClient.setQueryData(queryKeys.routine(routine.id, locale), routine);
      await invalidateRoutineViews(queryClient);
    },
  });
}

export function useDeleteRoutine(client: ApiClient): UseMutationResult<void, Error, string> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => client.deleteRoutine(id),
    onSuccess: async (_result, id) => {
      // La routine répond désormais 404 : garder sa dernière version en cache
      // ferait afficher un écran qui n'existe plus.
      queryClient.removeQueries({ queryKey: ["routine", id] });
      await invalidateRoutineViews(queryClient);
    },
  });
}

export function useDuplicateRoutine(
  client: ApiClient,
  locale?: Locale,
): UseMutationResult<RoutineDetail, Error, string> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => client.duplicateRoutine(id, locale),
    onSuccess: async (routine) => {
      queryClient.setQueryData(queryKeys.routine(routine.id, locale), routine);
      await invalidateRoutineViews(queryClient);
    },
  });
}

export function useReorderRoutines(
  client: ApiClient,
): UseMutationResult<RoutineSummary[], Error, string[]> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (ids: string[]) => client.reorderRoutines(ids),
    onSuccess: () => invalidateRoutineViews(queryClient),
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
