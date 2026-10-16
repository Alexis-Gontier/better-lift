import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type Props = {
  title: string;
  /** Onglets de la page (ligne soulignée sous le titre). */
  tabs?: ReactNode;
  /** Actions à droite de la ligne d'onglets ; l'action principale en dernier. */
  actions?: ReactNode;
  className?: string;
  children: ReactNode;
};

/** Gabarit commun : contenu centré, titre, ligne onglets + actions, puis le contenu. */
export function Page({ title, tabs, actions, className, children }: Props) {
  return (
    <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-6 pt-16 pb-12">
      <h1 className="font-medium text-2xl tracking-tight">{title}</h1>
      {(tabs || actions) && (
        <div className="mt-4 flex min-h-11 items-end justify-between gap-4 border-b">
          <div className="flex items-end gap-1">{tabs}</div>
          <div className="flex items-center gap-3 pb-2">{actions}</div>
        </div>
      )}
      {/* `*:shrink-0` : une carte en overflow-hidden perd sa hauteur minimale ; sans cela, la
          colonne l'écrase au lieu de laisser la page défiler. */}
      <div className={cn("@container flex flex-1 flex-col gap-6 pt-6 *:shrink-0", className)}>
        {children}
      </div>
    </div>
  );
}
