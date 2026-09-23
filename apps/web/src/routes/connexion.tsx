import { createFileRoute, useNavigate, useRouter } from "@tanstack/react-router";
import { z } from "zod";
import { champEtat, etatForceRendu } from "@/components/etats/etat-force";
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
    <main className="grid h-screen place-items-center px-6">
      <div className="flex w-full max-w-sm flex-col items-center gap-6">
        <div className="flex items-center gap-2">
          <span
            aria-hidden="true"
            className="size-5.5 rounded-md"
            style={{ background: "var(--accent)" }}
          />
          <span className="text-sm font-semibold tracking-tight">better-lift</span>
        </div>

        {force ?? (
          <FormulaireConnexion
            onSucces={async () => {
              // Relire la session PUIS invalider : sans l'invalidation, le
              // `beforeLoad` de `_protege` relirait l'ancien contexte et
              // renverrait aussitôt vers /connexion.
              await chargerSession();
              await router.invalidate();
              await navigate({ to: redirect ?? "/seances" });
            }}
          />
        )}
      </div>
    </main>
  );
}
