import { createFileRoute } from "@tanstack/react-router";
import { TrainingSettings } from "@/features/settings/training-settings";

export const Route = createFileRoute("/_app/settings/training")({
  staticData: { crumb: "Entraînement" },
  component: TrainingSettings,
});
