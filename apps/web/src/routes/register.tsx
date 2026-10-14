import { createFileRoute, redirect, useNavigate, useRouter } from "@tanstack/react-router";
import { z } from "zod";
import { renderForcedState, stateField } from "@/components/states/forced-state";
import { AuthForm } from "@/features/auth/auth-form";
import { loadSession } from "@/lib/auth-session";

const search = z.object({ redirect: z.string().optional(), state: stateField });

// L'inscription (D196), réservée aux adresses de SIGNUP_ALLOWLIST côté API.
export const Route = createFileRoute("/register")({
  validateSearch: search,
  beforeLoad: ({ context }) => {
    if (context.auth.session) throw redirect({ to: "/" });
  },
  component: RegisterPage,
});

function RegisterPage() {
  const { redirect: returnTo, state } = Route.useSearch();
  const navigate = useNavigate();
  const router = useRouter();

  const forced = renderForcedState(state, "L'API est injoignable.", () =>
    navigate({ to: "/register", search: (s) => ({ ...s, state: undefined }) }),
  );

  return (
    <main className="flex min-h-screen items-center justify-center px-6 py-10">
      <div className="w-full max-w-xs">
        {forced ?? (
          <AuthForm
            mode="inscription"
            redirect={returnTo}
            onSuccess={async () => {
              // Better Auth ouvre la session à l'inscription : même enchaînement
              // que la connexion.
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
