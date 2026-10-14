import { createFileRoute, redirect, useNavigate, useRouter } from "@tanstack/react-router";
import { z } from "zod";
import { renderForcedState, stateField } from "@/components/states/forced-state";
import { AuthForm } from "@/features/auth/auth-form";
import { loadSession } from "@/lib/auth-session";

const search = z.object({ redirect: z.string().optional(), state: stateField });

export const Route = createFileRoute("/login")({
  validateSearch: search,
  // Une session déjà ouverte n'a rien à faire ici (D196).
  beforeLoad: ({ context }) => {
    if (context.auth.session) throw redirect({ to: "/" });
  },
  component: LoginPage,
});

function LoginPage() {
  const { redirect: returnTo, state } = Route.useSearch();
  const navigate = useNavigate();
  const router = useRouter();

  const forced = renderForcedState(state, "L'API est injoignable.", () =>
    navigate({ to: "/login", search: (s) => ({ ...s, state: undefined }) }),
  );

  return (
    <main className="flex min-h-screen items-center justify-center px-6 py-10">
      <div className="w-full max-w-xs">
        {forced ?? (
          <AuthForm
            mode="connexion"
            redirect={returnTo}
            onSuccess={async () => {
              // Relire la session PUIS invalider : sans l'invalidation, le
              // `beforeLoad` de `_protege` relirait l'ancien contexte et
              // renverrait aussitôt ici.
              await loadSession();
              await router.invalidate();
              await navigate({ to: returnTo ?? "/" });
            }}
          />
        )}
      </div>
    </main>
  );
}
