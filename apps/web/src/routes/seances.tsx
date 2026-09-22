import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/seances")({ component: Seances });

function Seances() {
  return <p className="p-4">Écran à venir.</p>;
}
