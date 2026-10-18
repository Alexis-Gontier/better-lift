import { createFileRoute } from "@tanstack/react-router";
import { LoginForm } from "@/features/auth/login-form";

export const Route = createFileRoute("/_auth/login")({
  // Où revenir après la connexion ; filtré par `cibleApresConnexion` à l'usage.
  validateSearch: (s: Record<string, unknown>): { redirect?: string } =>
    typeof s.redirect === "string" ? { redirect: s.redirect } : {},
  component: LoginForm,
});
