import { createFileRoute } from "@tanstack/react-router";
import { NewExercisePane } from "@/features/exercises/exercise-form";

export const Route = createFileRoute("/_app/exercises/new")({
  staticData: { crumb: "Nouvel exercice" },
  component: NewExercisePane,
});
