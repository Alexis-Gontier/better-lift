import { cn } from "cn";
import type { ReactNode } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Coquille } from "./coquille";
import { EnTetePage } from "./en-tete-page";

type Props = {
  titre: string;
  /** Dans l'en-tête, à droite : sélecteur de période, boutons. */
  actions?: ReactNode;
  /** `pleine` : la grille d'analyse ; `lecture` : une colonne centrée (Profil). */
  largeur?: "pleine" | "lecture";
  children?: ReactNode;
};

/** Le gabarit des pages d'analyse (D133, D157) : l'en-tête commun, puis le contenu qui défile. */
export function PageTableau({ titre, actions, largeur = "pleine", children }: Props) {
  return (
    <Coquille>
      <EnTetePage titre={titre} actions={actions}>
        <ScrollArea className="min-h-0 flex-1">
          <div
            className={cn(
              "flex flex-col gap-6 px-6 py-6",
              largeur === "lecture" && "mx-auto w-full max-w-2xl",
            )}
          >
            {children}
          </div>
        </ScrollArea>
      </EnTetePage>
    </Coquille>
  );
}
