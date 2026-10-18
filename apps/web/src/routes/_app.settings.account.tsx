import { createFileRoute } from "@tanstack/react-router";
import { AccountSettings } from "@/features/settings/account-settings";

export const Route = createFileRoute("/_app/settings/account")({
  staticData: { crumb: "Compte" },
  component: AccountSettings,
});
