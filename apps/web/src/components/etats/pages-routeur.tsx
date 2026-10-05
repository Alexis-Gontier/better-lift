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
function Cadre({ titre, children }: { titre: string; children: ReactNode }) {
  return (
    <main className="flex h-full min-h-96 flex-1 flex-col items-center justify-center gap-3 bg-background px-8 text-center">
      <Logo className="mb-2 size-9" />
      <h1 className="text-lg font-semibold text-(--ink)">{titre}</h1>
      {children}
    </main>
  );
}

const aplat =
  "rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--focus-ring)";
const secondaire =
  "rounded-md border border-(--line-strong) px-4 py-2 text-sm font-medium text-(--ink) hover:bg-(--surface-3) focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--focus-ring)";

/** Une adresse inconnue : `defaultNotFoundComponent` du routeur. */
export function PageIntrouvable() {
  return (
    // Une adresse inconnue n'a pas de coquille autour : l'écran prend la page.
    <div className="flex min-h-svh flex-col">
      <Cadre titre="Page introuvable">
        <p className="max-w-sm text-sm text-(--ink-subtle)">
          Cette adresse ne mène à rien. Le lien est peut-être ancien, ou l'élément a été supprimé.
        </p>
        <Link to="/seances" className={`mt-3 ${aplat}`}>
          Revenir aux séances
        </Link>
      </Cadre>
    </div>
  );
}

/**
 * Un écran qui a planté : `defaultErrorComponent` du routeur. Rendu à la place
 * de la route fautive seulement — dans le panneau de détail, la coquille reste.
 */
export function PageErreur({ error, reset }: ErrorComponentProps) {
  const router = useRouter();
  return (
    <Cadre titre="Quelque chose s'est mal passé">
      <p role="alert" className="max-w-sm text-sm text-(--ink-subtle)">
        Cet écran n'a pas pu s'afficher. Réessaie ; si ça recommence, recharge la page.
      </p>
      {import.meta.env.DEV ? (
        <p className="max-w-md font-mono text-xs text-(--danger-ink)">
          {error instanceof Error ? error.message : String(error)}
        </p>
      ) : null}
      <div className="mt-3 flex gap-2">
        <button
          type="button"
          className={aplat}
          onClick={() => {
            // `reset` efface l'erreur de rendu, `invalidate` relance les
            // chargements de la route : les deux causes possibles sont couvertes.
            reset();
            void router.invalidate();
          }}
        >
          Réessayer
        </button>
        <Link to="/seances" className={secondaire}>
          Revenir aux séances
        </Link>
      </div>
    </Cadre>
  );
}
