import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/routines")({ component: Routines });

function Routines() {
  return <p className="p-4">Écran à venir.</p>;
}
