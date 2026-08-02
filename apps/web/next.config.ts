import { type NextConfig } from "next";

/**
 * Next 16 : Turbopack est le bundler par défaut. Ne pas réintroduire de
 * configuration webpack (doc 10).
 */
const nextConfig: NextConfig = {
  reactStrictMode: true,
  typedRoutes: true,
  // Les autres packages du workspace sont publiés compilés en ESM et se
  // consomment tels quels. `@better-lift/ui` est l'exception : il exporte ses
  // `.tsx` bruts, c'est Next qui les transpile (D24).
  transpilePackages: ["@better-lift/ui"],

  experimental: {
    /**
     * Active `unauthorized()` et `forbidden()` de `next/navigation`, et avec
     * eux les conventions `app/unauthorized.tsx` et `app/forbidden.tsx`. Sans
     * ce drapeau les deux fonctions lèvent à l'exécution et les deux fichiers
     * sont du code mort.
     *
     * Toujours expérimental côté Next : le drapeau peut disparaître ou changer
     * de nom d'une mineure à l'autre. Le vérifier lors d'une montée de version.
     */
    authInterrupts: true,
  },
};

export default nextConfig;
