import Link from "next/link";

import { LoginForm } from "@/features/auth/login-form";

export const metadata = { title: "Connexion — better-lift" };

/**
 * Emplacement prévu par la doc 05 : `(auth)/login`. Le groupe n'a pas encore
 * de layout propre, la V1 lui en donnera un.
 */
export default function LoginPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center gap-8 px-6 py-16">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Connexion</h1>
        <p className="text-sm text-ink-muted">
          Spike d’authentification : une seule instance Better Auth, servie par l’API.
        </p>
      </header>

      <LoginForm />

      <Link href="/" className="text-center text-sm text-ink-muted underline underline-offset-4">
        Retour
      </Link>
    </main>
  );
}
