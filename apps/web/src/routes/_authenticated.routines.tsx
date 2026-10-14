import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Outlet, useParams } from "@tanstack/react-router";
import { z } from "zod";
import { ListDetailPage } from "@/components/shell/list-detail-page";
import { ErrorState } from "@/components/states/error-state";
import { isForcedEmpty, renderForcedState, stateField } from "@/components/states/forced-state";
import { LoadingState } from "@/components/states/loading-state";
import { routinesOptions, useReorderRoutines } from "@/features/routines/queries";
import { RoutineList } from "@/features/routines/routine-list";
import { fold } from "@/lib/text";

// La routine ouverte vit dans le CHEMIN (`/routines/$id`, `/routines/new`,
// D81). Plus de paramètre `edition` : une routine ouverte est toujours modifiable.
const search = z.object({ q: z.string().optional().catch(undefined), state: stateField });

/**
 * La mise en page des routines, en disposition `colonne` : la colonne de
 * sélection à gauche, l'espace de travail à droite — l'`Outlet`, toujours
 * présent (invite, éditeur, ou routine neuve selon la route enfant).
 */
export const Route = createFileRoute("/_authenticated/routines")({
  validateSearch: search,
  component: RoutinesPage,
});

function RoutinesPage() {
  const { q = "", state } = Route.useSearch();
  const { id } = useParams({ strict: false });
  const navigate = Route.useNavigate();
  const list = useQuery(routinesOptions());
  const reorder = useReorderRoutines();

  function listPanel() {
    const forced = renderForcedState(state, "Les routines n'ont pas pu être chargées.", () =>
      navigate({ search: (s) => ({ ...s, state: undefined }) }),
    );
    if (forced) return forced;
    if (list.isPending) return <LoadingState />;
    if (list.isError) {
      return (
        <ErrorState
          message="Les routines n'ont pas pu être chargées."
          onRetry={() => list.refetch()}
        />
      );
    }
    const all = isForcedEmpty(state) ? [] : list.data;
    const searching = fold(q.trim());
    return (
      <RoutineList
        routines={searching ? all.filter((r) => fold(r.nom).includes(searching)) : all}
        filter={q}
        onFilter={(text) => {
          // Le filtre garde la routine ouverte : son chemin reste, seul `q` change.
          const search = (s: { q?: string }) => ({ ...s, q: text || undefined });
          if (id) navigate({ to: "/routines/$id", params: { id }, search, replace: true });
          else navigate({ search, replace: true });
        }}
        selectedId={id}
        onSelect={(rId) => navigate({ to: "/routines/$id", params: { id: rId }, search: (s) => s })}
        onCreate={() => navigate({ to: "/routines/new" })}
        onReorder={(ids) => reorder.mutate(ids)}
      />
    );
  }

  return (
    <ListDetailPage
      to="/routines"
      title="Routines"
      layout="column"
      list={listPanel()}
      detail={<Outlet />}
    />
  );
}
