import { cn } from "@/lib/utils";

type Props = { title: string; hint?: string; className?: string };

/** Cadre du wireframe : une zone titrée qui dit ce qui viendra à cet endroit. */
export function Zone({ title, hint, className }: Props) {
  return (
    <div
      className={cn("flex min-h-24 flex-col gap-1 rounded-xl border border-dashed p-4", className)}
    >
      <span className="font-medium text-sm">{title}</span>
      {hint && <span className="text-muted-foreground text-xs">{hint}</span>}
    </div>
  );
}
