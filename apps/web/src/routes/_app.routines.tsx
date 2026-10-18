import { createFileRoute, Outlet } from "@tanstack/react-router";
import { ListDetailPage } from "@/components/list-detail";
import { routinesQuery } from "@/features/routines/queries";
import { RoutineList } from "@/features/routines/routine-list";
import { RoutinesFooter } from "@/features/routines/routines-footer";

export const Route = createFileRoute("/_app/routines")({
  staticData: { crumb: "Routines" },
  // Sans attendre : la liste montre son squelette pendant ce temps (D300).
  loader: ({ context }) => void context.queryClient.prefetchQuery(routinesQuery()),
  component: RoutinesPage,
});

/** La liste reste montée ; la routine ouverte est la route enfant (D235). */
function RoutinesPage() {
  return (
    <ListDetailPage
      title="Routines"
      footer={<RoutinesFooter />}
      storageId="routines"
      // L'éditeur et sa colonne de droite défilent chacun de leur côté (D255).
      detailScroll="columns"
      detail={<Outlet />}
    >
      <RoutineList />
    </ListDetailPage>
  );
}
