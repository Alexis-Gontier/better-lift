import { NextRequest } from "next/server";
import { describe, expect, it } from "vitest";

import { config, proxy } from "./proxy";

const SESSION_COOKIE = "better-auth.session_token";

function request(path: string, cookie?: string) {
  const nextRequest = new NextRequest(new URL(path, "http://localhost:3000"));

  if (cookie) {
    nextRequest.cookies.set(cookie, "jeton-quelconque");
  }

  return nextRequest;
}

/** `NextResponse.redirect` pose la destination dans l'en-tête `location`. */
function redirectionOf(response: ReturnType<typeof proxy>) {
  const location = response.headers.get("location");
  return location ? new URL(location) : null;
}

describe("proxy — routes protégées", () => {
  it("should redirect to login with the requested path when no session cookie is present", () => {
    const destination = redirectionOf(proxy(request("/routines/42?onglet=series")));

    expect(destination?.pathname).toBe("/login");
    expect(destination?.searchParams.get("next")).toBe("/routines/42?onglet=series");
  });

  it("should let the request through when a session cookie is present", () => {
    const response = proxy(request("/dashboard", SESSION_COOKIE));

    expect(redirectionOf(response)).toBeNull();
  });

  /**
   * Better Auth préfixe le cookie de `__Secure-` dès qu'il émet en HTTPS.
   * Ignorer ce nom donnerait un proxy qui fonctionne en local et déconnecte
   * tout le monde en production — le pire des deux mondes, puisque la CI ne le
   * verrait pas.
   */
  it("should recognise the __Secure- prefixed cookie used over https", () => {
    const response = proxy(request("/dashboard", `__Secure-${SESSION_COOKIE}`));

    expect(redirectionOf(response)).toBeNull();
  });
});

describe("proxy — pages d'authentification", () => {
  it("should send an authenticated visitor away from login and signup", () => {
    for (const path of ["/login", "/signup", "/forgot-password"]) {
      expect(redirectionOf(proxy(request(path, SESSION_COOKIE)))?.pathname).toBe("/dashboard");
    }
  });

  it("should keep reset-password reachable while authenticated", () => {
    // On peut très bien cliquer sur son lien de réinitialisation depuis un
    // navigateur où l'on est déjà connecté : rediriger serait une impasse.
    const response = proxy(request("/reset-password?token=abc", SESSION_COOKIE));

    expect(redirectionOf(response)).toBeNull();
  });

  it("should serve the auth pages to anonymous visitors", () => {
    expect(redirectionOf(proxy(request("/login")))).toBeNull();
  });
});

describe("proxy — matcher", () => {
  /**
   * Le matcher est écrit littéralement parce que Next l'analyse statiquement au
   * build et n'exécute pas de spread. Ce test est le filet qui compense cette
   * duplication : sans lui, une page d'authentification ajoutée au code mais
   * oubliée dans le matcher ne serait jamais interceptée.
   */
  it("should list every auth route handled by the proxy", () => {
    for (const route of ["/login", "/signup", "/forgot-password", "/reset-password"]) {
      expect(config.matcher).toContain(route);
    }
  });
});
