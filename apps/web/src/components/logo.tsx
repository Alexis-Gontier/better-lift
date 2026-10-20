import { cn } from "@/lib/utils";

/**
 * Le symbole « La charge » (D322, D329), sans sa tuile : trois disques sur une barre courte, en
 * diagonale, à la couleur du texte (`currentColor`). Mêmes cotes que `public/favicon.svg`, la
 * tuile en moins. Le `viewBox` est recadré sur le symbole tourné : la boîte SVG est le dessin,
 * sans marge, pour que l'écart avec le nom soit l'écart voulu. Décoratif : le nom l'accompagne.
 */
export function Logo({ className }: { className?: string }) {
  return (
    <svg
      viewBox="51.6 46 158.4 158.4"
      aria-hidden="true"
      className={cn("shrink-0 fill-current", className)}
    >
      <g transform="translate(128 128) rotate(-45) translate(-128 -128)">
        <rect x="42" y="120" width="12" height="16" />
        <rect x="52" y="96" width="28" height="64" rx="6" />
        <rect x="86" y="72" width="32" height="112" rx="6" />
        <rect x="124" y="44" width="36" height="168" rx="6" />
        <rect x="158" y="108" width="18" height="40" rx="3" />
        <rect x="174" y="120" width="40" height="16" />
      </g>
    </svg>
  );
}
