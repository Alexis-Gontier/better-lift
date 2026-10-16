import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";

export function NotFoundPage() {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-3 p-6 text-center">
      <p className="font-mono text-muted-foreground text-sm">404</p>
      <h1 className="font-semibold text-2xl">Page introuvable</h1>
      <Button asChild variant="outline">
        <Link to="/">Retour à l'accueil</Link>
      </Button>
    </div>
  );
}

export function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-3 p-6 text-center">
      <h1 className="font-semibold text-2xl">Une erreur est survenue</h1>
      <p className="text-muted-foreground text-sm">Cette page n'a pas pu s'afficher.</p>
      <Button variant="outline" onClick={reset}>
        Réessayer
      </Button>
    </div>
  );
}
