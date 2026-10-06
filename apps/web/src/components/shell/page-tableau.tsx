import { cn } from "cn";
import type { ReactNode } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Coquille } from "./coquille";

type Props = {
  titre: string;
  /** À droite du titre : sélecteur de période, boutons. */
  actions?: ReactNode;
  /** `pleine` : la grille d'analyse ; `lecture` : une colonne centrée (Profil). */
  largeur?: "pleine" | "lecture";
  children: ReactNode;
};

/** Le gabarit des pages d'analyse (D133) : un en-tête, puis le contenu qui défile. */
export function PageTableau({ titre, actions, largeur = "pleine", children }: Props) {
  return (
    <Coquille>
      <ScrollArea className="h-full">
        <div
          className={cn(
            "flex flex-col gap-6 px-8 py-7",
            largeur === "lecture" && "mx-auto w-full max-w-2xl",
          )}
        >
          <header className="flex flex-wrap items-center justify-between gap-4">
            <h1 className="text-[26px] font-extrabold tracking-tight">{titre}</h1>
            {actions}
          </header>
          {children}
        </div>
      </ScrollArea>
    </Coquille>
  );
}
