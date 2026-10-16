import { createFileRoute } from "@tanstack/react-router";
import { PreferencesSettings } from "@/features/settings/preferences-settings";

export const Route = createFileRoute("/_app/settings/preferences")({
  staticData: { crumb: "Préférences" },
  component: PreferencesSettings,
});
