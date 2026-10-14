import { cn } from "cn";
import type { ReactNode } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AppShell } from "./app-shell";

type Props = {
  title: string;
  /** Dans l'en-tête, à droite : sélecteur de période, boutons. */
  actions?: ReactNode;
  /** `pleine` : la grille d'analyse ; `lecture` : une colonne centrée (Profil). */
  width?: "pleine" | "lecture";
  children?: ReactNode;
};

/** Le gabarit des pages d'analyse (D133) : le contenu qui défile (D200 : en-tête retiré). */
export function PageLayout({ width = "pleine", children }: Props) {
  return (
    <AppShell>
      <ScrollArea className="min-h-0 flex-1">
        <div
          className={cn(
            "flex flex-col gap-6 px-6 py-6",
            width === "lecture" && "mx-auto w-full max-w-2xl",
          )}
        >
          {children}
        </div>
      </ScrollArea>
    </AppShell>
  );
}
