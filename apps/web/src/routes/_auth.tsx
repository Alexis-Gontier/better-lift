import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { Brand } from "@/components/brand";
import { Logo } from "@/components/logo";

export const Route = createFileRoute("/_auth")({
  staticData: { etats: true },
  // Déjà connecté : rien à faire ici.
  beforeLoad: ({ context }) => {
    if (context.auth.session) throw redirect({ to: "/" });
  },
  component: AuthLayout,
});

/**
 * Hors coquille, à la façon des SaaS (ElevenLabs, Vercel) : pas de carte, le symbole et le nom
 * en haut de page, assemblés comme dans la barre latérale (D329), une colonne étroite centrée.
 */
function AuthLayout() {
  return (
    <main className="relative flex min-h-svh flex-col items-center justify-center bg-background px-6 py-28">
      <div className="absolute top-14 flex items-center gap-1.5">
        <Logo className="size-5" />
        <Brand />
      </div>
      <div className="w-full max-w-90">
        <Outlet />
      </div>
    </main>
  );
}
