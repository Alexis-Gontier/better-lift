"use client";

import { usePathname } from "next/navigation";

import { cn } from "@better-lift/ui/lib/utils";

import { RoutineRail } from "./routine-rail";

/**
 * Mise en page à deux volets du segment `/routines` : navigation à gauche,
 * édition à droite (doc 05).
 *
 * ## Pourquoi un layout et pas une page
 *
 * Le volet gauche vit dans `routines/layout.tsx`, donc **au-dessus** des
 * routes qu'il dessert. Next ne le remonte pas d'une navigation à l'autre :
 * l'état replié des dossiers, la position de défilement et le filtre survivent
 * au passage d'une routine à la suivante, et seul le volet droit est rendu à
 * nouveau. Le même écran construit en page unique aurait à choisir entre
 * remonter la colonne à chaque clic ou renoncer aux URL par routine.
 *
 * ## La colonne touche le bord
 *
 * `AppContent` retire la mesure de lecture sur ce segment : le volet vient
 * donc se coller à la barre latérale de l'application, dont il prolonge la
 * logique — on descend de « Routines » dans la navigation générale vers
 * *quelle* routine dans la navigation locale. Décollé de la gouttière, il se
 * lirait comme un panneau flottant sans rapport avec elle.
 *
 * C'est aussi ce qui lui permet d'occuper toute la hauteur : la séparation
 * verticale court du haut de la zone de contenu jusqu'en bas, sans le blanc
 * qu'une marge du conteneur y aurait laissé.
 *
 * ## Le maître-détail sous `xl`
 *
 * Le seuil se calcule plutôt qu'il ne se choisit. Il a d'abord été posé à
 * `2xl` : l'éditeur avait alors une seconde colonne — le panneau d'ajout
 * d'exercice, 20 rem —, et à 1280 px il ne serait resté ~320 px aux cartes,
 * où la grille des séries (type · charge · reps · RPE) devient illisible.
 *
 * Le panneau d'ajout est passé en dialogue (doc 05), l'éditeur n'a plus qu'une
 * colonne, et les 20 rem récupérées rendent le seuil tenable à 1280 px. C'est
 * la seule raison du changement, et elle disparaîtrait avec le dialogue.
 *
 * En dessous, on bascule en maître-détail — **un seul volet visible à la
 * fois**, celui que l'URL désigne : la liste sur `/routines`, le contenu
 * partout ailleurs.
 */
export function RoutinesWorkspace({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  /** La racine du segment : c'est là que la liste est l'écran principal. */
  const atIndex = pathname === "/routines";

  return (
    <div className="flex min-h-0 flex-1 xl:grid xl:grid-cols-[17rem_minmax(0,1fr)]">
      <aside
        className={cn(
          "flex min-w-0 flex-col border-border xl:border-r",
          /*
            `h-` et non `max-h-` : avec une hauteur maximale, une colonne plus
            courte que l'écran s'arrête où son contenu s'arrête, et le filet
            vertical avec elle — il pend au milieu de la page au lieu de
            séparer deux volets. La hauteur fixe le fait courir de bout en
            bout, la liste défilant à l'intérieur.

            `top-0` : il n'y a plus de barre haute pour caler le volet en
            dessous, `(app)/layout.tsx` n'en posant plus. `h-dvh` prend donc
            toute la hauteur de la fenêtre, sans rien à en retirer.
          */
          "xl:sticky xl:top-0 xl:h-dvh xl:min-h-0",
          // Ses marges à lui, puisque le conteneur n'en pose plus.
          "px-3 py-4",
          atIndex ? "flex-1" : "hidden xl:flex",
        )}
      >
        <RoutineRail />
      </aside>

      {/*
        Le volet droit porte la mesure de lecture que le conteneur ne pose plus.
        `max-w-5xl` et non `7xl` : la colonne de gauche a déjà pris 17 rem, et
        un éditeur de 1280 px à côté d'elle repousserait le bouton
        « Enregistrer » à l'autre bout de l'écran.
      */}
      {/*
        `flex flex-col` de bout en bout : c'est ce qui donne au volet droit une
        hauteur réelle. Sans elle, un écran qui se centre verticalement —
        l'état « aucune routine choisie » — se collerait en haut, faute de
        savoir sur quelle hauteur se centrer.
      */}
      <div
        className={cn(
          "min-w-0 flex-1 flex-col px-4 py-6 md:px-8",
          atIndex ? "hidden xl:flex" : "flex",
        )}
      >
        <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col">{children}</div>
      </div>
    </div>
  );
}
