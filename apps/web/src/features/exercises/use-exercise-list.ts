import type { ExerciceResume } from "@better-lift/shared";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import type { Sort } from "./exercise-filters";
import type { Practice } from "./exercise-grid";
import { catalogOptions, practicedOptions } from "./queries";

type Filters = { q?: string; target?: string; equipment?: string };

/**
 * La liste de la grille (D208, D210). Deux requêtes paginées : les exercices PRATIQUÉS (par
 * leurs slugs) et le CATALOGUE. « Mes exercices » ne lit que la première ; le catalogue trié
 * par pertinence ou par pratique les met bout à bout — les pratiqués en tête (les plus récents
 * d'abord, comme Hevy, ou les plus faits), puis le reste du catalogue sans eux, dans l'ordre
 * « pertinence » de l'API. Trier côté client les seules pages chargées laisserait des
 * exercices pratiqués plus loin, hors de la tête.
 */
export function useExerciseList({
  mine,
  sort,
  ...filters
}: Filters & { mine: boolean; sort: Sort }) {
  const practiced = useQuery(practicedOptions());
  const practicedMap = useMemo(
    () => new Map<string, Practice>((practiced.data ?? []).map((p) => [p.slug, p])),
    [practiced.data],
  );

  const byPractice = sort !== "name";
  const wantsHead = mine || byPractice;
  const slugs = practiced.data?.map((p) => p.slug) ?? [];
  // Sans exercice pratiqué, la tête est vide d'office : `slugs` vide serait refusé par l'API.
  const headActive = wantsHead && practiced.isSuccess && slugs.length > 0;
  const head = useInfiniteQuery({ ...catalogOptions({ ...filters, slugs }), enabled: headActive });
  const rest = useInfiniteQuery({
    ...catalogOptions({ ...filters, order: byPractice ? "relevance" : "name" }),
    enabled: !mine,
  });

  const headList = useMemo(() => {
    const all = headActive ? (head.data?.pages.flatMap((p) => p.exercices) ?? []) : [];
    if (!byPractice) return all;
    const value = (slug: string) => {
      const p = practicedMap.get(slug);
      return sort === "count" ? (p?.nbSeances ?? 0) : Date.parse(p?.derniere ?? "0");
    };
    // `sort` est stable : à égalité, l'ordre par nom de l'API tient.
    return [...all].sort((a, b) => value(b.slug) - value(a.slug));
  }, [headActive, head.data, byPractice, sort, practicedMap]);

  const headDone = !headActive || (head.isSuccess && !head.hasNextPage);
  const exercises = useMemo<ExerciceResume[]>(() => {
    if (mine) return headList;
    const catalog = rest.data?.pages.flatMap((p) => p.exercices) ?? [];
    if (!byPractice) return catalog;
    // Le reste du catalogue n'arrive qu'après toute la tête, sans ses exercices.
    return headDone ? [...headList, ...catalog.filter((e) => !practicedMap.has(e.slug))] : headList;
  }, [mine, headList, rest.data, byPractice, headDone, practicedMap]);

  const error =
    (wantsHead && practiced.isError) || (headActive && head.isError) || (!mine && rest.isError);
  const pending =
    (wantsHead && practiced.isPending) ||
    (headActive && head.isPending) ||
    (!mine && rest.isPending);
  const next = headActive && head.hasNextPage ? head : mine ? null : rest;

  return {
    practiced,
    /** Combien d'exercices pratiqués ouvrent le catalogue : la grille les titre à part. */
    headCount: !mine && byPractice && headDone ? headList.length : 0,
    practicedMap,
    exercises,
    total: mine
      ? headActive
        ? head.data?.pages[0]?.total
        : practiced.data
          ? 0
          : undefined
      : rest.data?.pages[0]?.total,
    pending,
    error,
    retry: () => {
      if (practiced.isError) practiced.refetch();
      if (head.isError) head.refetch();
      if (rest.isError) rest.refetch();
    },
    hasMore: next !== null && !!next.hasNextPage && !next.isFetchingNextPage,
    more: () => next?.fetchNextPage(),
  };
}
