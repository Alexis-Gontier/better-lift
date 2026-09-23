import { createFileRoute, redirect } from "@tanstack/react-router";

// Route de mise en page SANS chemin : elle n'ajoute rien à l'URL — `/exercices`
// reste `/exercices` — elle pose une frontière. Son composant vaut `Outlet` par
// défaut, il n'y a rien à déclarer.
//
// La garde vit ici et non dans les composants : `beforeLoad` s'exécute AVANT
// tout rendu, donc l'écran protégé n'est jamais peint puis retiré.
export const Route = createFileRoute("/_protege")({
  beforeLoad: ({ context, location }) => {
    if (!context.auth.session) {
      throw redirect({ to: "/connexion", search: { redirect: location.href } });
    }
  },
});
