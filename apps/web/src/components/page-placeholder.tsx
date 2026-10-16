type Props = { title: string; description: string };

/** Page-titre de la passe 1 : un nom, une phrase, un cadre vide. */
export function PagePlaceholder({ title, description }: Props) {
  return (
    <div className="flex flex-1 flex-col gap-4">
      <div>
        <h1 className="font-semibold text-2xl tracking-tight">{title}</h1>
        <p className="text-muted-foreground text-sm">{description}</p>
      </div>
      <div className="flex min-h-64 flex-1 items-center justify-center rounded-lg border border-dashed text-muted-foreground text-sm">
        Zone à dessiner
      </div>
    </div>
  );
}
