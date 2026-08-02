"use client";

import "@better-lift/ui/globals.css";

/**
 * Dernier recours : une erreur levée dans le layout racine ou dans les
 * providers. À ce stade le layout racine n'a pas rendu, donc ce fichier fournit
 * lui-même `<html>` et `<body>` — c'est la seule page de l'app qui a le droit
 * de le faire, et l'oublier produit un écran blanc.
 *
 * Même raison pour l'import de `globals.css` : la feuille est importée par le
 * layout racine, qui est justement ce qui manque ici.
 *
 * Ni `next-themes` ni aucun provider ne tournent : la classe `.dark` n'est pas
 * posée sur `<html>`. Le rendu retombe donc sur le thème clair, et c'est
 * volontaire — brancher un provider dans une frontière dont le rôle est de
 * survivre à la panne des providers serait absurde.
 *
 * En développement, Next affiche son overlay par-dessus ce composant : pour le
 * voir tel qu'il sera, il faut un `next build && next start`.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="fr">
      <body className="min-h-screen antialiased">
        <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center gap-4 px-6 text-center">
          <h1 className="text-2xl font-semibold tracking-tight">L’application n’a pas démarré</h1>
          <p className="text-muted-foreground">
            Une erreur est survenue avant même l’affichage de la page. Recharger devrait suffire.
          </p>
          {error.digest ? (
            <p className="font-mono text-xs text-muted-foreground">Réf. {error.digest}</p>
          ) : null}
          <div>
            <button
              type="button"
              onClick={reset}
              className="rounded-lg bg-primary px-4 py-2 font-medium text-primary-foreground"
            >
              Recharger
            </button>
          </div>
        </main>
      </body>
    </html>
  );
}
