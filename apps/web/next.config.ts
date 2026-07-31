import { type NextConfig } from "next";

/**
 * Next 16 : Turbopack est le bundler par défaut. Ne pas réintroduire de
 * configuration webpack (doc 10).
 */
const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Les packages du workspace sont publiés compilés en ESM : Next les consomme
  // tels quels, sans transpilation supplémentaire.
  typedRoutes: true,
};

export default nextConfig;
