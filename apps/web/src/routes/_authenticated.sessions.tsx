import { useInfiniteQuery } from "@tanstack/react-query";
import { createFileRoute, Outlet, useParams } from "@tanstack/react-router";
import { useEffect } from "react";
import { z } from "zod";
import { ListDetailPage } from "@/components/shell/list-detail-page";
import { ErrorState } from "@/components/states/error-state";
import { isForcedEmpty, renderForcedState, stateField } from "@/components/states/forced-state";
import { LoadingState } from "@/components/states/loading-state";
import { filterSessions } from "@/features/sessions/calculations";
import { sessionsOptions } from "@/features/sessions/queries";
import { SessionList } from "@/features/sessions/session-list";

// La séance ouverte vit dans le CHEMIN (`/sessions/$id`, D81) ; les paramètres de
// recherche ne portent plus que ce qui filtre ou force un état.
const search = z.object({ q: z.string().optional().catch(undefined), state: stateField });

/**
 * La mise en page des séances : la coquille et la liste. Le détail est la route
 * enfant `$id`, rendue par l'`Outlet` — la liste ne se recharge pas quand on
 * passe d'une séance à l'autre.
 */
export const Route = createFileRoute("/_authenticated/sessions")({
  validateSearch: search,
  component: SessionsPage,
});

function SessionsPage() {
  const { q = "", state } = Route.useSearch();
  const { id } = useParams({ strict: false });
  const navigate = Route.useNavigate();
  const list = useInfiniteQuery(sessionsOptions());
  const loaded = list.data?.pages.flatMap((p) => p.seances) ?? [];
  // ↑ / ↓ suivent le fil tel qu'il s'affiche : filtré (D160).
  const visible = filterSessions(loaded, q);
  const ids = visible.map((x) => x.id);

  // ↑ / ↓ passent d'une séance à l'autre (D140), sauf pendant une saisie.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key !== "ArrowDown" && e.key !== "ArrowUp") return;
      const target = e.target as HTMLElement;
      if (target.closest("input, textarea, [contenteditable], [role=dialog]")) return;
      const i = id ? ids.indexOf(id) : -1;
      const next = ids[e.key === "ArrowDown" ? i + 1 : Math.max(0, i - 1)];
      if (!next || next === id) return;
      e.preventDefault();
      navigate({ to: "/sessions/$id", params: { id: next }, search: (s) => s });
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [id, ids, navigate]);

  function listPanel() {
    const forced = renderForcedState(state, "L'historique n'a pas pu être chargé.", () =>
      navigate({ search: (s) => ({ ...s, state: undefined }) }),
    );
    if (forced) return forced;
    if (list.isPending) return <LoadingState />;
    if (list.isError) {
      return (
        <ErrorState message="L'historique n'a pas pu être chargé." onRetry={() => list.refetch()} />
      );
    }
    const empty = isForcedEmpty(state);
    return (
      <SessionList
        sessions={empty ? [] : visible}
        loadedCount={loaded.length}
        filter={q}
        onFilter={(text) => {
          // Le filtre garde la séance ouverte : son chemin reste, seul `q` change.
          const search = (s: { q?: string }) => ({ ...s, q: text || undefined });
          if (id) navigate({ to: "/sessions/$id", params: { id }, search, replace: true });
          else navigate({ search, replace: true });
        }}
        total={empty ? 0 : (list.data.pages[0]?.total ?? 0)}
        hasMore={!empty && list.hasNextPage}
        loadMore={list.isFetchingNextPage}
        onMore={() => list.fetchNextPage()}
        selectedId={id}
        onSelect={(sId) => navigate({ to: "/sessions/$id", params: { id: sId }, search: (s) => s })}
      />
    );
  }

  // Le panneau de détail n'existe que lorsqu'une séance est ouverte : la coquille
  // change alors son jeu de panneaux (et sa clé de persistance).
  return (
    <ListDetailPage
      to="/sessions"
      title="Séances"
      layout="feed"
      list={listPanel()}
      detail={id ? <Outlet /> : undefined}
    />
  );
}
