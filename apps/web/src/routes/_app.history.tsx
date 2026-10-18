import { createFileRoute, Outlet } from "@tanstack/react-router";
import { ListDetailPage } from "@/components/list-detail";
import { seancesQuery } from "@/features/history/queries";
import { SessionList } from "@/features/history/session-list";

export const Route = createFileRoute("/_app/history")({
  staticData: { crumb: "Historique" },
  // Sans attendre : la liste montre son squelette pendant ce temps (D300).
  loader: ({ context }) => void context.queryClient.prefetchInfiniteQuery(seancesQuery()),
  component: HistoryPage,
});

/** La liste reste montée ; la séance ouverte est la route enfant (D235). */
function HistoryPage() {
  return (
    <ListDetailPage title="Historique" storageId="historique" detail={<Outlet />}>
      <SessionList />
    </ListDetailPage>
  );
}
