import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { ErrorState } from "@/components/states/error-state";
import { LoadingState } from "@/components/states/loading-state";
import { sessionOptions, useDeleteSession } from "@/features/sessions/queries";
import { SessionDetail } from "@/features/sessions/session-detail";

/** Une séance de l'historique, ouverte dans le panneau de détail (D81). */
export const Route = createFileRoute("/_authenticated/sessions/$id")({ component: SessionPage });

function SessionPage() {
  const { id } = Route.useParams();
  const navigate = Route.useNavigate();
  const detail = useQuery(sessionOptions(id));
  const remove = useDeleteSession();

  if (detail.isPending) return <LoadingState rows={6} />;
  if (detail.isError) {
    return (
      <ErrorState
        message="Cette séance n'a pas pu être chargée."
        onRetry={() => detail.refetch()}
      />
    );
  }
  return (
    <SessionDetail
      session={detail.data}
      onClose={() => navigate({ to: "/sessions", search: (s) => s })}
      onDelete={() =>
        remove.mutate(id, { onSuccess: () => navigate({ to: "/sessions", search: (s) => s }) })
      }
    />
  );
}
