import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  component: () => <h1 className="p-6 font-semibold text-2xl">better-lift</h1>,
});
