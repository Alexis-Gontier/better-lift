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
  type CreateWorkoutInput,
  type CurrentUser,
  type DataExport,
  type DeleteAccountInput,
  type ExerciseDetail,
  type ExerciseHistoryQuery,
  type ExerciseHistoryResponse,
  type ExerciseListQuery,
  type ExerciseListResponse,
  type ExerciseRecordsResponse,
  type HealthResponse,
  type LastPerformance,
  type Locale,
  type RoutineDetail,
  type RoutineFolder,
  type RoutineFolderInput,
  type RoutineListQuery,
  type RoutineStructureInput,
  type RoutineSummary,
  type StatsMuscleDistributionResponse,
  type StatsRange,
  type StatsRecord,
  type StatsStreakResponse,
  type StatsSummary,
  type StatsVolumeQuery,
  type StatsVolumeResponse,
  type UpdateExerciseInput,
  type UpdateMeInput,
  type UpdateRoutineInput,
  type VersionResponse,
  type WorkoutDetail,
  type WorkoutListQuery,
  type WorkoutListResponse,
  type WorkoutSaveResponse,
  type WorkoutStructureInput,
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
  /**
   * Historique et records dépendent des **séances**, pas du catalogue : ils sont
   * invalidés par `invalidateWorkoutViews`, jamais par une écriture d'exercice.
   */
  exerciseHistory: (id: string) => ["exercise-history", id] as const,
  exerciseRecords: (id: string) => ["exercise-records", id] as const,

  routineFolders: ["routine-folders"] as const,
  routines: (query: Partial<RoutineListQuery> = {}) => ["routines", query] as const,
  /** Racine des listes de routines : cible des invalidations après écriture. */
  routinesAll: ["routines"] as const,
  routine: (id: string, locale?: Locale) => ["routine", id, locale ?? null] as const,

  workouts: (query: Partial<WorkoutListQuery> = {}) => ["workouts", query] as const,
  /** Racine de l'historique : cible des invalidations après écriture. */
  workoutsAll: ["workouts"] as const,
  workout: (id: string, locale?: Locale) => ["workout", id, locale ?? null] as const,
  /**
   * Les identifiants sont **triés** dans la clé : deux écrans qui demandent les
   * mêmes exercices dans un ordre différent posent la même question, et doivent
   * partager la même entrée de cache.
   */
  lastPerformance: (exerciseIds: readonly string[]) =>
    ["last-performance", [...exerciseIds].sort()] as const,
  /** Les dernières performances changent à chaque séance enregistrée. */
  lastPerformanceAll: ["last-performance"] as const,

  statsSummary: (range?: StatsRange) => ["stats", "summary", range ?? null] as const,
  statsVolume: (query: Partial<StatsVolumeQuery> = {}) => ["stats", "volume", query] as const,
  statsMuscleDistribution: (range?: StatsRange) =>
    ["stats", "muscle-distribution", range ?? null] as const,
  statsStreak: (weeks?: number) => ["stats", "streak", weeks ?? null] as const,
  statsRecords: (query: { limit?: number; locale?: Locale } = {}) =>
    ["stats", "records", query] as const,
  /**
   * Racine des statistiques. Toute écriture de séance les périme **toutes** —
   * volume, régularité, records — sans qu'on sache depuis la mutation quelles
   * fenêtres sont affichées.
   */
  statsAll: ["stats"] as const,
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
 * Export RGPD.
 *
 * Une **mutation** alors que rien n'est modifié, et rien n'est mis en cache :
 * un export se déclenche par un clic, se télécharge, et n'a aucune raison
 * d'être resservi — le garder en cache immobiliserait l'historique entier en
 * mémoire pour une valeur que personne ne relira.
 */
export function useExportMyData(client: ApiClient): UseMutationResult<DataExport, Error, void> {
  return useMutation({ mutationFn: () => client.exportMyData() });
}

/**
 * Suppression du compte.
 *
 * `clear()` et non une invalidation : il n'y a plus rien à recharger, et toute
 * requête relancée derrière répondrait 401. Le cache doit partir en entier,
 * synchronement, avant que l'écran ne redirige vers la page de connexion.
 */
export function useDeleteAccount(
  client: ApiClient,
): UseMutationResult<void, Error, DeleteAccountInput> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: DeleteAccountInput) => client.deleteAccount(input),
    onSuccess: () => {
      queryClient.clear();
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
 * Historique personnel sur un exercice, paginé par curseur.
 *
 * Il change à chaque séance enregistrée, contrairement au catalogue :
 * `staleTime` est donc court, et `invalidateWorkoutViews` le remet à zéro dès
 * qu'une séance est écrite, corrigée ou supprimée.
 */
export function useExerciseHistory(
  client: ApiClient,
  id: string,
  query: Partial<ExerciseHistoryQuery> = {},
): UseInfiniteQueryResult<InfiniteData<ExerciseHistoryResponse>, Error> {
  return useInfiniteQuery({
    queryKey: queryKeys.exerciseHistory(id),
    queryFn: ({ pageParam, signal }) =>
      client.getExerciseHistory(id, { ...query, cursor: pageParam }, signal),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    // Un 404 est une réponse — l'exercice n'est pas le vôtre —, pas une panne.
    retry: false,
  });
}

export function useExerciseRecords(
  client: ApiClient,
  id: string,
): UseQueryResult<ExerciseRecordsResponse, Error> {
  return useQuery({
    queryKey: queryKeys.exerciseRecords(id),
    queryFn: ({ signal }) => client.getExerciseRecords(id, signal),
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

// ── Séances ───────────────────────────────────────────────────────────────

/**
 * Enregistrer une séance touche presque tout : l'historique, les compteurs de
 * la routine d'origine, les dernières performances qui pré-remplissent le
 * prochain entraînement, et les records de la fiche exercice.
 *
 * Tout est invalidé d'un bloc. Invalider finement demanderait de rejouer côté
 * client la logique des compteurs et des records — celle-là même que l'API
 * calcule serveur pour qu'elle ne soit écrite qu'une fois (règle non
 * négociable n°6).
 */
async function invalidateWorkoutViews(queryClient: ReturnType<typeof useQueryClient>) {
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: queryKeys.workoutsAll }),
    queryClient.invalidateQueries({ queryKey: queryKeys.lastPerformanceAll }),
    queryClient.invalidateQueries({ queryKey: queryKeys.routinesAll }),
    // L'historique et les records d'un exercice sont de la donnée de séance :
    // une séance enregistrée les change, sans toucher au catalogue.
    queryClient.invalidateQueries({ queryKey: ["exercise-history"] }),
    queryClient.invalidateQueries({ queryKey: ["exercise-records"] }),
    // Enregistrer, corriger ou supprimer une séance change le volume, la
    // régularité et les records. Le tableau de bord doit suivre.
    queryClient.invalidateQueries({ queryKey: queryKeys.statsAll }),
  ]);
}

export function useWorkouts(
  client: ApiClient,
  query: Partial<WorkoutListQuery> = {},
): UseInfiniteQueryResult<InfiniteData<WorkoutListResponse>, Error> {
  return useInfiniteQuery({
    queryKey: queryKeys.workouts(query),
    queryFn: ({ pageParam, signal }) =>
      client.listWorkouts({ ...query, cursor: pageParam }, signal),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    staleTime: 30_000,
  });
}

export function useWorkout(
  client: ApiClient,
  id: string,
  locale?: Locale,
): UseQueryResult<WorkoutDetail, Error> {
  return useQuery({
    queryKey: queryKeys.workout(id, locale),
    queryFn: ({ signal }) => client.getWorkout(id, locale, signal),
    // Un 404 est une réponse, pas une panne.
    retry: false,
  });
}

/**
 * Valeurs de la dernière séance, pour pré-remplir l'écran de saisie.
 *
 * Chargées **une fois** au démarrage d'une séance et gardées fraîches toute sa
 * durée : ce qui s'affiche dans la colonne « PRÉC. » ne doit pas changer sous
 * les yeux de quelqu'un qui a la barre en main.
 */
export function useLastPerformance(
  client: ApiClient,
  exerciseIds: readonly string[],
): UseQueryResult<LastPerformance[], Error> {
  return useQuery({
    queryKey: queryKeys.lastPerformance(exerciseIds),
    queryFn: ({ signal }) => client.getLastPerformance([...exerciseIds], signal),
    enabled: exerciseIds.length > 0,
    staleTime: 30 * 60_000,
  });
}

/**
 * Enregistrement d'une séance terminée.
 *
 * La mutation est **rejouable sans précaution** : l'identifiant vient de
 * l'appelant, et l'API renvoie la séance existante plutôt que d'en créer une
 * seconde. C'est ce qui permet à la file de synchronisation hors ligne de
 * réessayer sans tenir de registre de ce qui est déjà parti.
 */
export function useCreateWorkout(
  client: ApiClient,
  locale?: Locale,
): UseMutationResult<WorkoutSaveResponse, Error, CreateWorkoutInput> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateWorkoutInput) => client.createWorkout(input, locale),
    onSuccess: async (workout) => {
      queryClient.setQueryData(queryKeys.workout(workout.id, locale), workout);
      await invalidateWorkoutViews(queryClient);
    },
  });
}

export function useUpdateWorkout(
  client: ApiClient,
  locale?: Locale,
): UseMutationResult<WorkoutSaveResponse, Error, { id: string; input: WorkoutStructureInput }> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, input }) => client.updateWorkout(id, input, locale),
    onSuccess: async (workout) => {
      queryClient.setQueryData(queryKeys.workout(workout.id, locale), workout);
      await invalidateWorkoutViews(queryClient);
    },
  });
}

export function useDeleteWorkout(client: ApiClient): UseMutationResult<void, Error, string> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => client.deleteWorkout(id),
    onSuccess: async (_result, id) => {
      // La séance répond désormais 404 : garder sa dernière version en cache
      // ferait afficher un écran qui n'existe plus.
      queryClient.removeQueries({ queryKey: ["workout", id] });
      await invalidateWorkoutViews(queryClient);
    },
  });
}

/**
 * Statistiques du tableau de bord.
 *
 * Cinq requêtes indépendantes plutôt qu'une : la doc 05 veut un `<Suspense>`
 * par bloc, et les blocs ne doivent pas se bloquer mutuellement. Une réponse
 * unique ferait attendre les quatre cartes que la heatmap soit prête.
 *
 * `staleTime` long et volontaire : ces chiffres ne bougent qu'à l'écriture
 * d'une séance, qui invalide déjà `statsAll`. Les rafraîchir au retour d'onglet
 * ne ferait que payer cinq requêtes pour le même résultat.
 */
const STATS_STALE_TIME = 5 * 60_000;

export function useStatsSummary(
  client: ApiClient,
  range?: StatsRange,
): UseQueryResult<StatsSummary, Error> {
  return useQuery({
    queryKey: queryKeys.statsSummary(range),
    queryFn: ({ signal }) => client.getStatsSummary(range, signal),
    staleTime: STATS_STALE_TIME,
  });
}

export function useStatsVolume(
  client: ApiClient,
  query: Partial<StatsVolumeQuery> = {},
): UseQueryResult<StatsVolumeResponse, Error> {
  return useQuery({
    queryKey: queryKeys.statsVolume(query),
    queryFn: ({ signal }) => client.getStatsVolume(query, signal),
    staleTime: STATS_STALE_TIME,
  });
}

export function useStatsMuscleDistribution(
  client: ApiClient,
  range?: StatsRange,
): UseQueryResult<StatsMuscleDistributionResponse, Error> {
  return useQuery({
    queryKey: queryKeys.statsMuscleDistribution(range),
    queryFn: ({ signal }) => client.getStatsMuscleDistribution(range, signal),
    staleTime: STATS_STALE_TIME,
  });
}

export function useStatsStreak(
  client: ApiClient,
  weeks?: number,
): UseQueryResult<StatsStreakResponse, Error> {
  return useQuery({
    queryKey: queryKeys.statsStreak(weeks),
    queryFn: ({ signal }) => client.getStatsStreak(weeks, signal),
    staleTime: STATS_STALE_TIME,
  });
}

export function useStatsRecords(
  client: ApiClient,
  query: { limit?: number; locale?: Locale } = {},
): UseQueryResult<StatsRecord[], Error> {
  return useQuery({
    queryKey: queryKeys.statsRecords(query),
    queryFn: ({ signal }) => client.getStatsRecords(query, signal),
    staleTime: STATS_STALE_TIME,
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
