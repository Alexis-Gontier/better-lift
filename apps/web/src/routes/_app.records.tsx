import { createFileRoute } from "@tanstack/react-router";
import { Page } from "@/components/page";
import { RecordsPage } from "@/features/records/records-page";
import { faitsQuery } from "@/lib/exercices";

export const Route = createFileRoute("/_app/records")({
  staticData: { crumb: "Records" },
  // Sans attendre : la page montre son squelette pendant ce temps (D300).
  loader: ({ context }) => void context.queryClient.prefetchQuery(faitsQuery()),
  component: () => (
    <Page title="Records">
      <RecordsPage />
    </Page>
  ),
});
