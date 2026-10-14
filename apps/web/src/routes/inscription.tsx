import { createFileRoute, redirect, useNavigate, useRouter } from "@tanstack/react-router";
import { z } from "zod";
import { champEtat, etatForceRendu } from "@/components/etats/etat-force";
import { FormulaireAuth } from "@/features/auth/formulaire-auth";
import { chargerSession } from "@/lib/auth-session";

const recherche = z.object({ redirect: z.string().optional(), etat: champEtat });

// L'inscription (D196), réservée aux adresses de SIGNUP_ALLOWLIST côté API.
export const Route = createFileRoute("/inscription")({
  validateSearch: recherche,
  beforeLoad: ({ context }) => {
    if (context.auth.session) throw redirect({ to: "/" });
  },
  component: PageInscription,
});

function PageInscription() {
  const { redirect: retour, etat } = Route.useSearch();
  const navigate = useNavigate();
  const router = useRouter();

  const force = etatForceRendu(etat, "L'API est injoignable.", () =>
    navigate({ to: "/inscription", search: (s) => ({ ...s, etat: undefined }) }),
  );

  return (
    <main className="flex min-h-screen items-center justify-center px-6 py-10">
      <div className="w-full max-w-xs">
        {force ?? (
          <FormulaireAuth
            mode="inscription"
            redirect={retour}
            onSucces={async () => {
              // Better Auth ouvre la session à l'inscription : même enchaînement
              // que la connexion.
              await chargerSession();
              await router.invalidate();
              await navigate({ to: retour ?? "/" });
            }}
          />
        )}
      </div>
    </main>
  );
}
