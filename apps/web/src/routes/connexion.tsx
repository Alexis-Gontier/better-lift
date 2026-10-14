import { createFileRoute, redirect, useNavigate, useRouter } from "@tanstack/react-router";
import { z } from "zod";
import { champEtat, etatForceRendu } from "@/components/etats/etat-force";
import { FormulaireAuth } from "@/features/auth/formulaire-auth";
import { chargerSession } from "@/lib/auth-session";

const recherche = z.object({ redirect: z.string().optional(), etat: champEtat });

export const Route = createFileRoute("/connexion")({
  validateSearch: recherche,
  // Une session déjà ouverte n'a rien à faire ici (D196).
  beforeLoad: ({ context }) => {
    if (context.auth.session) throw redirect({ to: "/" });
  },
  component: PageConnexion,
});

function PageConnexion() {
  const { redirect: retour, etat } = Route.useSearch();
  const navigate = useNavigate();
  const router = useRouter();

  const force = etatForceRendu(etat, "L'API est injoignable.", () =>
    navigate({ to: "/connexion", search: (s) => ({ ...s, etat: undefined }) }),
  );

  return (
    <main className="flex min-h-screen items-center justify-center px-6 py-10">
      <div className="w-full max-w-xs">
        {force ?? (
          <FormulaireAuth
            mode="connexion"
            redirect={retour}
            onSucces={async () => {
              // Relire la session PUIS invalider : sans l'invalidation, le
              // `beforeLoad` de `_protege` relirait l'ancien contexte et
              // renverrait aussitôt ici.
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
