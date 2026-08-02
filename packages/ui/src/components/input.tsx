import { cva, type VariantProps } from "class-variance-authority";
import type * as React from "react";

import { cn } from "@better-lift/ui/lib/utils";

/**
 * ÉCART ASSUMÉ AVEC LE REGISTRE SHADCN — variante `size`.
 *
 * Le composant du registre n'a pas de variante : il code `h-9` en dur. La
 * hauteur est remontée ici parce qu'elle décrit une **densité**, pas une
 * exception locale — le jour où deux écrans la choisissent différemment à coups
 * de `className`, ils divergent sans que rien ne le signale.
 *
 * Conséquence : un `npx shadcn add input --overwrite` écrase ce fichier et fait
 * disparaître la variante en silence. Les appels `size="lg"` cesseraient
 * simplement d'avoir un effet, sans erreur de compilation — `size` est un
 * attribut légal sur `<input>`. Vérifier ce fichier après toute réinstallation
 * d'`input`, et après tout `add` d'un composant qui en dépend (`input-group`,
 * `field`).
 *
 * Le `size` natif d'`<input>` (une largeur en caractères) est écarté du typage
 * plus bas : les deux ne peuvent pas coexister, et personne ne s'en sert.
 */
const inputVariants = cva(
  "w-full min-w-0 rounded-md border border-input bg-transparent px-2.5 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 md:text-sm dark:bg-input/30 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40",
  {
    variants: {
      size: {
        /** Densité des écrans internes, où les champs sont nombreux. */
        default: "h-9",
        /** 44 px : la cible tactile minimale. Formulaires remplis au doigt. */
        lg: "h-11",
      },
    },
    defaultVariants: {
      size: "default",
    },
  },
);

function Input({
  className,
  type,
  size,
  ...props
}: Omit<React.ComponentProps<"input">, "size"> & VariantProps<typeof inputVariants>) {
  return (
    <input
      type={type}
      data-slot="input"
      data-size={size ?? "default"}
      className={cn(inputVariants({ size }), className)}
      {...props}
    />
  );
}

/*
  On n'exporte que `Input`, comme le registre. `inputVariants` reste privé :
  contrairement à `buttonVariants`, que les consommateurs utilisent pour styler
  un `<Link>` en bouton, il n'a aucun usage hors de ce fichier — et chaque
  export ajouté est un écart de plus à retrouver après une réinstallation.
*/
export { Input };
