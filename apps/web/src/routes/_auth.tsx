import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/_auth")({
  staticData: { proto: { states: true } },
  component: AuthLayout,
});

/**
 * Hors coquille, à la façon des SaaS (ElevenLabs, Vercel) : pas de carte, le nom en haut de
 * page, une colonne étroite centrée en dessous. Le nom reste en texte (D229).
 */
function AuthLayout() {
  return (
    <main className="flex min-h-svh flex-col items-center bg-background px-6 pt-14 pb-10">
      <span className="font-semibold text-lg tracking-tight">better-lift</span>
      <div className="mt-16 w-full max-w-90 md:mt-20">
        <Outlet />
      </div>
    </main>
  );
}
