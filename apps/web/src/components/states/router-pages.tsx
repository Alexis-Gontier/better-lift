import { type ErrorComponentProps, Link, useRouter } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { Logo } from "@/components/logo";

/**
 * Les deux écrans que le routeur rend à la place d'une route : l'adresse qui ne
 * mène nulle part, et l'écran qui a planté. Sans eux, TanStack Router affiche
 * les siens, en anglais et hors du système.
 *
 * Ils n'utilisent ni la coquille ni une requête : ils doivent tenir même quand
 * c'est la coquille ou l'API qui est en cause.
 */
function Frame({ title, children }: { title: string; children: ReactNode }) {
  return (
    <main className="flex h-full min-h-96 flex-1 flex-col items-center justify-center gap-3 bg-background px-8 text-center">
      <Logo className="mb-2 size-9" />
      <h1 className="text-lg font-semibold text-foreground">{title}</h1>
      {children}
    </main>
  );
}

const filled =
  "rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring";
const secondary =
  "rounded-md border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring";

/** Une adresse inconnue : `defaultNotFoundComponent` du routeur. */
export function NotFoundPage() {
  return (
    // Une adresse inconnue n'a pas de coquille autour : l'écran prend la page.
    <div className="flex min-h-svh flex-col">
      <Frame title="Page introuvable">
        <p className="max-w-sm text-sm text-muted-foreground">
          Cette adresse ne mène à rien. Le lien est peut-être ancien, ou l'élément a été supprimé.
        </p>
        <Link to="/sessions" className={`mt-3 ${filled}`}>
          Revenir aux séances
        </Link>
      </Frame>
    </div>
  );
}

/**
 * Un écran qui a planté : `defaultErrorComponent` du routeur. Rendu à la place
 * de la route fautive seulement — dans le panneau de détail, la coquille reste.
 */
export function ErrorPage({ error, reset }: ErrorComponentProps) {
  const router = useRouter();
  return (
    <Frame title="Quelque chose s'est mal passé">
      <p role="alert" className="max-w-sm text-sm text-muted-foreground">
        Cet écran n'a pas pu s'afficher. Réessaie ; si ça recommence, recharge la page.
      </p>
      {import.meta.env.DEV ? (
        <p className="max-w-md font-mono text-xs text-destructive-ink">
          {error instanceof Error ? error.message : String(error)}
        </p>
      ) : null}
      <div className="mt-3 flex gap-2">
        <button
          type="button"
          className={filled}
          onClick={() => {
            // `reset` efface l'erreur de rendu, `invalidate` relance les
            // chargements de la route : les deux causes possibles sont couvertes.
            reset();
            void router.invalidate();
          }}
        >
          Réessayer
        </button>
        <Link to="/sessions" className={secondary}>
          Revenir aux séances
        </Link>
      </div>
    </Frame>
  );
}
