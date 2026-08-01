import Link from "next/link";

/**
 * Coquille commune aux écrans d'authentification (doc 05). Colonne centrée,
 * sans navigation : à ce stade du parcours, tout lien qui n'est pas l'action en
 * cours est une occasion de partir.
 */
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-sm flex-col justify-center gap-8 px-6 py-16">
      <Link href="/" className="text-2xl font-semibold tracking-tight">
        better-lift
      </Link>
      {children}
    </main>
  );
}
