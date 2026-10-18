import { createFileRoute, Outlet } from "@tanstack/react-router";
import { Brand } from "@/components/brand";

export const Route = createFileRoute("/_auth")({
  staticData: { etats: true },
  component: AuthLayout,
});

/**
 * Hors coquille, à la façon des SaaS (ElevenLabs, Vercel) : pas de carte, le nom en haut de
 * page, une colonne étroite centrée dans la fenêtre. Le nom reste en texte (D229).
 */
function AuthLayout() {
  return (
    <main className="relative flex min-h-svh flex-col items-center justify-center bg-background px-6 py-28">
      <div className="absolute top-14">
        <Brand />
      </div>
      <div className="w-full max-w-90">
        <Outlet />
      </div>
    </main>
  );
}
