import { cn } from "cn";
import type { ReactNode } from "react";

/** Une carte du Tableau de bord (D135) : en-tête en petites capitales, détail à droite. */
export function Carte({
  titre,
  detail,
  className,
  children,
}: {
  titre: string;
  detail?: ReactNode;
  className?: string;
  children: ReactNode;
}) {
  return (
    <section className={cn("flex flex-col gap-3 rounded-2xl bg-(--surface-2) p-5", className)}>
      <header className="flex items-baseline justify-between gap-4">
        <h2 className="text-[11px] font-bold tracking-[0.09em] text-(--ink-subtle) uppercase">
          {titre}
        </h2>
        {detail ? <p className="text-xs text-(--ink-muted)">{detail}</p> : null}
      </header>
      {children}
    </section>
  );
}
