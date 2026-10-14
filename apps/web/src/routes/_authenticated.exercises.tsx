import { GROUPES } from "@better-lift/shared";
import { useInfiniteQuery } from "@tanstack/react-query";
import { createFileRoute, Outlet, useParams } from "@tanstack/react-router";
import { z } from "zod";
import { ListDetailPage } from "@/components/shell/list-detail-page";
import { ErrorState } from "@/components/states/error-state";
import { isForcedEmpty, renderForcedState, stateField } from "@/components/states/forced-state";
import { LoadingState } from "@/components/states/loading-state";
import { ExerciseList } from "@/features/exercises/exercise-list";
import { catalogOptions } from "@/features/exercises/queries";

// L'exercice ouvert vit dans le CHEMIN (`/exercises/$slug`, D81) ; la recherche
// et le groupe restent en paramètres : ce sont des filtres, et ils suivent quand
// on passe d'un exercice à l'autre. `.catch(undefined)` évite qu'une URL
// trafiquée fasse échouer tout l'écran — un filtre inconnu s'ignore.
const search = z.object({
  q: z.string().optional(),
  group: z.enum(GROUPES).optional().catch(undefined),
  state: stateField,
});

/**
 * La mise en page du catalogue : la coquille et la liste filtrée. La fiche est
 * la route enfant `$slug`, rendue par l'`Outlet`.
 */
export const Route = createFileRoute("/_authenticated/exercises")({
  validateSearch: search,
  component: ExercisesPage,
});

function ExercisesPage() {
  const { q, group, state } = Route.useSearch();
  const { slug } = useParams({ strict: false });
  const navigate = Route.useNavigate();

  const list = useInfiniteQuery(catalogOptions({ q, groupe: group }));

  const abandon = () => navigate({ search: (s) => ({ ...s, state: undefined }) });
  const empty = isForcedEmpty(state);
  const exercises = empty ? [] : (list.data?.pages.flatMap((p) => p.exercices) ?? []);
  const total = empty ? 0 : (list.data?.pages[0]?.total ?? 0);

  function listPanel() {
    // Les états forcés par `?state=` restent prioritaires, en développement
    // seulement : ils permettent de revoir chargement et erreur à la demande,
    // maintenant que les vrais ne se déclenchent plus qu'au hasard du réseau.
    const forced = renderForcedState(state, "Le catalogue n'a pas pu être chargé.", abandon);
    if (forced) return forced;

    if (list.isPending) return <LoadingState />;
    if (list.isError) {
      return (
        <ErrorState message="Le catalogue n'a pas pu être chargé." onRetry={() => list.refetch()} />
      );
    }

    return (
      <ExerciseList
        exercises={exercises}
        total={total}
        hasMore={!empty && list.hasNextPage}
        loadMore={list.isFetchingNextPage}
        onMore={() => list.fetchNextPage()}
        q={q ?? ""}
        group={group}
        selectedSlug={slug}
        onSearch={(value) => navigate({ search: (s) => ({ ...s, q: value || undefined }) })}
        onGroup={(g) => navigate({ search: (s) => ({ ...s, group: g }) })}
        onSelect={(chosen) =>
          navigate({ to: "/exercises/$slug", params: { slug: chosen }, search: (s) => s })
        }
      />
    );
  }

  return (
    <ListDetailPage
      to="/exercises"
      title="Exercices"
      layout="feed"
      list={listPanel()}
      detail={slug ? <Outlet /> : undefined}
    />
  );
}
