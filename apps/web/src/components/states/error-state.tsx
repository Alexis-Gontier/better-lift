import { Button } from "@/components/ui/button";
export function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div
      role="alert"
      className="flex h-full flex-col items-center justify-center gap-3 px-8 text-center"
    >
      <p className="text-base font-medium text-foreground">Quelque chose n'a pas fonctionné</p>
      <p className="max-w-sm text-sm text-muted-foreground">{message}</p>
      {/* L'aplat d'action : le bouton `default`, orange bordé à ombre dure (D193). */}
      <Button onClick={onRetry}>Réessayer</Button>
    </div>
  );
}
