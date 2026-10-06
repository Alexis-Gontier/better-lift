import { createFileRoute, useNavigate, useRouter } from "@tanstack/react-router";
import { z } from "zod";
import { champEtat, etatForceRendu } from "@/components/etats/etat-force";
import { Logo } from "@/components/logo";
import { FormulaireConnexion } from "@/features/auth/formulaire-connexion";
import { chargerSession } from "@/lib/auth-session";

const recherche = z.object({ redirect: z.string().optional(), etat: champEtat });

export const Route = createFileRoute("/connexion")({
  validateSearch: recherche,
  component: PageConnexion,
});

function PageConnexion() {
  const { redirect, etat } = Route.useSearch();
  const navigate = useNavigate();
  const router = useRouter();

  const force = etatForceRendu(etat, "L'API est injoignable.", () =>
    navigate({ to: "/connexion", search: (s) => ({ ...s, etat: undefined }) }),
  );

  return (
    <main className="flex min-h-screen flex-col items-center px-6 py-10">
      <div className="flex w-full max-w-sm flex-1 flex-col justify-center">
        {/* D131 au bureau (D144) : la marque en tête, le formulaire dessous. */}
        <div className="mb-10 flex flex-col items-center gap-3">
          <Logo className="size-14" />
          <span className="text-xl font-extrabold tracking-tight">better-lift</span>
        </div>
        {force ?? (
          <FormulaireConnexion
            onSucces={async () => {
              // Relire la session PUIS invalider : sans l'invalidation, le
              // `beforeLoad` de `_protege` relirait l'ancien contexte et
              // renverrait aussitôt vers /connexion.
              await chargerSession();
              await router.invalidate();
              await navigate({ to: redirect ?? "/" });
            }}
          />
        )}
      </div>
      <p className="text-xs text-(--ink-faint)">Un carnet privé, pour quelques comptes.</p>
    </main>
  );
}
