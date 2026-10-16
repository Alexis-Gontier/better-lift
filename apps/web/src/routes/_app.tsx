import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/_app")({
  component: () => (
    <main className="flex min-h-svh flex-col p-6">
      <Outlet />
    </main>
  ),
});
