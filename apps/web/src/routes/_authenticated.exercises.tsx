import { CIBLES, EQUIPEMENTS } from "@better-lift/shared";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";
import { z } from "zod";
import { PageLayout } from "@/components/shell/page-layout";
import { EmptyState } from "@/components/states/empty-state";
import { ErrorState } from "@/components/states/error-state";
import { isForcedEmpty, renderForcedState, stateField } from "@/components/states/forced-state";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ExerciseFilters, type Sort } from "@/features/exercises/exercise-filters";
import { ExerciseGrid, type Practice } from "@/features/exercises/exercise-grid";
import { catalogOptions, practicedOptions } from "@/features/exercises/queries";

// Les filtres vivent dans l'URL (D200) et suivent jusqu'à la fiche, qui y ramène.
// `.catch(undefined)` : une URL trafiquée ignore le filtre au lieu de casser l'écran.
const search = z.object({
  q: z.string().optional(),
  target: z.enum(CIBLES).optional().catch(undefined),
  equipment: z.enum(EQUIPEMENTS).optional().catch(undefined),
  mine: z.literal(1).optional().catch(undefined),
  sort: z.enum(["name", "recent", "count"]).optional().catch(undefined),
  state: stateField,
});

/** La grille des exercices (D200). La fiche est une page à part, `/exercises/$slug`. */
export const Route = createFileRoute("/_authenticated/exercises")({
  validateSearch: search,
  component: ExercisesPage,
});

function ExercisesPage() {
  const { q, target, equipment, mine, sort, state } = Route.useSearch();
  const navigate = Route.useNavigate();
  const practiced = useQuery(practicedOptions());

  const practicedMap = useMemo(
    () => new Map<string, Practice>((practiced.data ?? []).map((p) => [p.slug, p])),
    [practiced.data],
  );
  // « Mes exercices » filtre par la liste des slugs pratiqués ; tant qu'elle n'est pas
  // là, la grille attend plutôt que de montrer tout le catalogue.
  const slugs = mine ? practiced.data?.map((p) => p.slug) : undefined;
  const list = useInfiniteQuery({
    ...catalogOptions({ q, target, equipment, slugs }),
    enabled: !mine || practiced.isSuccess,
  });

  const set = (patch: Partial<z.infer<typeof search>>) =>
    navigate({ search: (s) => ({ ...s, ...patch }), replace: true });
  const clear = () =>
    navigate({ search: (s) => ({ ...s, q: undefined, target: undefined, equipment: undefined }) });

  const order = mine ? (sort ?? "recent") : "name";
  const exercises = useMemo(() => {
    const all = list.data?.pages.flatMap((p) => p.exercices) ?? [];
    if (order === "name") return all;
    const value = (slug: string) => {
      const p = practicedMap.get(slug);
      return order === "count" ? (p?.nbSeances ?? 0) : Date.parse(p?.derniere ?? "0");
    };
    return [...all].sort((a, b) => value(b.slug) - value(a.slug));
  }, [list.data, order, practicedMap]);

  function content() {
    const forced = renderForcedState(state, "Le catalogue n'a pas pu être chargé.", () =>
      set({ state: undefined }),
    );
    if (forced) return forced;
    if (mine && practiced.isError) {
      return <ErrorState message={practiced.error.message} onRetry={() => practiced.refetch()} />;
    }
    if (list.isError) {
      return (
        <ErrorState message="Le catalogue n'a pas pu être chargé." onRetry={() => list.refetch()} />
      );
    }
    if (list.isPending) return <GridSkeleton />;
    if (isForcedEmpty(state) || exercises.length === 0) {
      return (
        <div className="py-16">
          <EmptyState
            title={
              mine && !practiced.data?.length
                ? "Pas encore d'exercice pratiqué."
                : "Aucun exercice ne correspond."
            }
            message={
              mine && !practiced.data?.length
                ? "Ils apparaîtront ici après ta première séance sur le téléphone."
                : "Essaie un autre muscle, un autre équipement, ou une autre recherche."
            }
            action={
              q || target || equipment ? (
                <Button variant="outline" onClick={clear}>
                  Effacer les filtres
                </Button>
              ) : undefined
            }
          />
        </div>
      );
    }
    return (
      <ExerciseGrid
        exercises={exercises}
        practiced={practicedMap}
        hasMore={list.hasNextPage && !list.isFetchingNextPage}
        onMore={() => list.fetchNextPage()}
      />
    );
  }

  const total = list.data?.pages[0]?.total;
  return (
    <PageLayout title="Exercices">
      <div className="flex items-baseline justify-between gap-4">
        <h1 className="text-2xl">Exercices</h1>
        {total !== undefined && !isForcedEmpty(state) ? (
          <span className="text-sm text-muted-foreground">
            {total.toLocaleString("fr-FR")} exercice{total > 1 ? "s" : ""}
          </span>
        ) : null}
      </div>
      <ExerciseFilters
        q={q ?? ""}
        target={target}
        equipment={equipment}
        mine={mine === 1}
        sort={order}
        onSearch={(value) => set({ q: value || undefined })}
        onTarget={(value) => set({ target: value as typeof target })}
        onEquipment={(value) => set({ equipment: value as typeof equipment })}
        onMine={(on) => set({ mine: on ? 1 : undefined, sort: undefined })}
        onSort={(value: Sort) => set({ sort: value })}
      />
      {content()}
    </PageLayout>
  );
}

function GridSkeleton() {
  return (
    <ul className="grid grid-cols-[repeat(auto-fill,minmax(11rem,1fr))] gap-4" aria-busy="true">
      {Array.from({ length: 12 }, (_, i) => (
        <li key={i}>
          <Skeleton className="aspect-[4/5] w-full" />
        </li>
      ))}
    </ul>
  );
}
