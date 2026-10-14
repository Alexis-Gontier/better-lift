import { CIBLES, EQUIPEMENTS } from "@better-lift/shared";
import { createFileRoute, Outlet, useParams } from "@tanstack/react-router";
import { z } from "zod";
import { ListDetailPage } from "@/components/shell/list-detail-page";
import { EmptyState } from "@/components/states/empty-state";
import { ErrorState } from "@/components/states/error-state";
import { isForcedEmpty, renderForcedState, stateField } from "@/components/states/forced-state";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { ExerciseFilters, type Sort } from "@/features/exercises/exercise-filters";
import { ExerciseGrid } from "@/features/exercises/exercise-grid";
import { useExerciseList } from "@/features/exercises/use-exercise-list";

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

/**
 * La grille des exercices (D200). Une fiche ouverte (`/exercises/$slug`, route enfant) la
 * repousse dans un panneau de gauche redimensionnable, la fiche à droite (D206).
 */
export const Route = createFileRoute("/_authenticated/exercises")({
  validateSearch: search,
  component: ExercisesPage,
});

function ExercisesPage() {
  const { q, target, equipment, mine, sort, state } = Route.useSearch();
  const navigate = Route.useNavigate();
  // Le slug de l'enfant décide du jeu de panneaux : la coquille ne connaît pas ses routes.
  const { slug } = useParams({ strict: false });
  const compact = slug !== undefined;
  // Par défaut : le nom pour le catalogue, la dernière fois pour « Mes exercices » (D208).
  const order: Sort = sort ?? (mine ? "recent" : "name");
  const list = useExerciseList({ q, target, equipment, mine: mine === 1, sort: order });
  const { practiced, exercises } = list;

  const set = (patch: Partial<z.infer<typeof search>>) =>
    navigate({ search: (s) => ({ ...s, ...patch }), replace: true });
  const clear = () =>
    navigate({ search: (s) => ({ ...s, q: undefined, target: undefined, equipment: undefined }) });

  function content() {
    const forced = renderForcedState(state, "Le catalogue n'a pas pu être chargé.", () =>
      set({ state: undefined }),
    );
    if (forced) return forced;
    if (list.error) {
      return (
        <ErrorState
          message={
            practiced.isError ? practiced.error.message : "Le catalogue n'a pas pu être chargé."
          }
          onRetry={list.retry}
        />
      );
    }
    if (list.pending) return <GridSkeleton />;
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
        selectedSlug={slug}
        exercises={exercises}
        practiced={list.practicedMap}
        hasMore={list.hasMore}
        onMore={list.more}
      />
    );
  }

  const total = list.total;
  const listPanel = (
    <ScrollArea className="h-full">
      <div className="flex flex-col gap-5 px-6 py-6">
        <div className="flex items-baseline justify-between gap-4">
          <h1 className="text-2xl">Exercices</h1>
          {total !== undefined && !isForcedEmpty(state) ? (
            <span className="text-sm text-muted-foreground">
              {total.toLocaleString("fr-FR")} exercice{total > 1 ? "s" : ""}
            </span>
          ) : null}
        </div>
        <ExerciseFilters
          compact={compact}
          q={q ?? ""}
          target={target}
          equipment={equipment}
          mine={mine === 1}
          sort={order}
          onSearch={(value) => set({ q: value || undefined })}
          onTarget={(value) => set({ target: value as typeof target })}
          onEquipment={(value) => set({ equipment: value as typeof equipment })}
          // Le tri choisi survit à la bascule ; seul le défaut suit « Mes exercices ».
          onMine={(on) => set({ mine: on ? 1 : undefined })}
          onSort={(value: Sort) => set({ sort: value })}
        />
        {content()}
      </div>
    </ScrollArea>
  );

  return (
    <ListDetailPage
      to="/exercises"
      title="Exercices"
      layout="catalog"
      list={listPanel}
      detail={compact ? <Outlet /> : undefined}
    />
  );
}

function GridSkeleton() {
  return (
    <ul className="grid grid-cols-[repeat(auto-fill,minmax(17rem,1fr))] gap-3" aria-busy="true">
      {Array.from({ length: 12 }, (_, i) => (
        <li key={i}>
          <Skeleton className="h-20 w-full" />
        </li>
      ))}
    </ul>
  );
}
