import { createFileRoute } from "@tanstack/react-router";
import { DataSettings } from "@/features/settings/data-settings";

export const Route = createFileRoute("/_app/settings/data")({
  staticData: { crumb: "Données" },
  component: DataSettings,
});
