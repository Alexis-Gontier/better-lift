import { type NextRequest, NextResponse } from "next/server";

/**
 * Protection des routes du groupe `(app)` (doc 05).
 *
 * En Next 16 ce fichier s'appelle `proxy.ts`, plus `middleware.ts`, et l'export
 * nommé est `proxy` — le build échoue si les deux coexistent (doc 10). Il
 * tourne en runtime Node, jamais en edge.
 *
 * ## Ce que ce fichier n'est pas
 *
 * **Ce n'est pas une frontière de sécurité.** Il se contente de constater la
 * *présence* d'un cookie de session pour éviter d'afficher une coquille vide à
 * un visiteur anonyme. Il ne vérifie ni la signature ni l'expiration : le faire
 * imposerait un aller-retour vers l'API à chaque navigation, pour une garantie
 * que l'API redonne de toute façon.
 *
 * L'autorisation réelle est côté API, et nulle part ailleurs : chaque route
 * `/v1/*` résout la session elle-même et une ressource d'autrui renvoie 404
 * (règle non négociable n°8). Un cookie forgé ne franchit donc rien — il
 * obtient au mieux un écran qui se remplira d'erreurs 401.
 */

/**
 * Better Auth préfixe le cookie de `__Secure-` dès qu'il émet en HTTPS. En
 * développement (HTTP) le nom est nu. Chercher les deux évite le grand
 * classique : un `proxy.ts` qui marche en local et déconnecte tout le monde en
 * production.
 */
const SESSION_COOKIE = "better-auth.session_token";
const SESSION_COOKIE_NAMES = [SESSION_COOKIE, `__Secure-${SESSION_COOKIE}`];

/** Pages d'authentification : un utilisateur déjà connecté n'a rien à y faire. */
const AUTH_ROUTES = ["/login", "/signup", "/forgot-password", "/reset-password"];

const DEFAULT_AUTHENTICATED_ROUTE = "/dashboard";

function hasSessionCookie(request: NextRequest): boolean {
  return SESSION_COOKIE_NAMES.some((name) => request.cookies.has(name));
}

export function proxy(request: NextRequest): NextResponse {
  const { pathname, search } = request.nextUrl;
  const authenticated = hasSessionCookie(request);

  if (AUTH_ROUTES.includes(pathname)) {
    /**
     * `/reset-password` reste accessible avec une session : on peut très bien
     * cliquer sur son lien de réinitialisation depuis un navigateur où l'on est
     * déjà connecté, et l'en rediriger serait une impasse.
     */
    if (authenticated && pathname !== "/reset-password") {
      return NextResponse.redirect(new URL(DEFAULT_AUTHENTICATED_ROUTE, request.url));
    }

    return NextResponse.next();
  }

  if (!authenticated) {
    const login = new URL("/login", request.url);

    // `next` porte le chemin demandé pour y revenir après connexion. On ne
    // garde que le chemin relatif : réinjecter une URL absolue fournie par la
    // requête ouvrirait une redirection ouverte.
    login.searchParams.set("next", `${pathname}${search}`);

    return NextResponse.redirect(login);
  }

  return NextResponse.next();
}

export const config = {
  /**
   * Les groupes de routes (`(app)`) n'apparaissent pas dans les URL : le
   * matcher liste donc les chemins réels. Toute nouvelle section authentifiée
   * doit être ajoutée ici — c'est le coût de cette approche, et il est
   * volontaire : un matcher qui prendrait tout par défaut ferait passer les
   * pages publiques et les assets par ce code sans raison.
   *
   * Les chemins sont écrits en toutes lettres, sans réutiliser `AUTH_ROUTES` :
   * Next analyse ce tableau **statiquement** au build et n'exécute pas de
   * spread. Le test de `proxy.ts` vérifie que les deux listes restent alignées.
   */
  matcher: [
    "/dashboard/:path*",
    "/routines/:path*",
    "/workouts/:path*",
    "/exercises/:path*",
    "/stats/:path*",
    "/settings/:path*",
    "/login",
    "/signup",
    "/forgot-password",
    "/reset-password",
  ],
};
