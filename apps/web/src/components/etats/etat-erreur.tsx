export function EtatErreur({ message, onReessayer }: { message: string; onReessayer: () => void }) {
  return (
    <div
      role="alert"
      className="flex h-full flex-col items-center justify-center gap-3 px-8 text-center"
    >
      <p className="text-base font-medium text-foreground">Quelque chose n'a pas fonctionné</p>
      <p className="max-w-sm text-sm text-muted-foreground">{message}</p>
      {/* L'aplat de la doctrine passe par `primary` : fond lime, encre sombre.
          Les classes valent mieux qu'un style en ligne — elles nomment le rôle,
          et c'est ce nom qui garantit l'encre sombre sur le lime. */}
      <button
        type="button"
        onClick={onReessayer}
        className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
      >
        Réessayer
      </button>
    </div>
  );
}
