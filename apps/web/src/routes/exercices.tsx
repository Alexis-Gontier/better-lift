import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/exercices")({ component: Exercices });

function Exercices() {
  return <p className="p-4">Écran à venir.</p>;
}
