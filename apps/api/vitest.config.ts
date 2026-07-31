import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    // Sans ça, les tests compilés dans dist/ seraient exécutés une seconde fois.
    exclude: ["**/node_modules/**", "**/dist/**"],
    // La validation d'environnement s'exécute à l'import : les tests doivent
    // disposer d'une configuration valide avant de charger l'application.
    env: {
      NODE_ENV: "test",
      DATABASE_URL: "postgresql://test:test@localhost:5432/betterlift_test",
      CORS_ORIGINS: "http://localhost:3000",
      APP_VERSION: "0.0.0-test",
      // Better Auth valide la longueur du secret au démarrage. Valeur de test,
      // sans rapport avec celle du `.env`.
      BETTER_AUTH_SECRET: "secret-de-test-uniquement-32-caracteres-minimum",
      BETTER_AUTH_URL: "http://localhost:3001",
    },
  },
});
