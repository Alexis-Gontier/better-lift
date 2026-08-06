"use client";

import { MonitorIcon, MoonIcon, SunIcon } from "lucide-react";
import * as React from "react";

import { cn } from "@better-lift/ui/lib/utils";

/**
 * Sélecteur de thème segmenté, d'après `theme-switcher` de Kibo UI
 * (https://www.kibo-ui.com/components/theme-switcher).
 *
 * Trois états et non deux : « système » est une valeur à part entière, pas
 * l'absence de choix. Une bascule binaire enferme définitivement qui l'a
 * touchée une fois — plus de retour à `prefers-color-scheme`, donc plus de
 * passage automatique au sombre le soir.
 *
 * ────────────────────────────────────────────────────────────────────────────
 * ÉCART ASSUMÉ — trois écarts au composant du registre. Les relire avant tout
 * `--overwrite` : aucun ne produit d'erreur de compilation s'il est effacé.
 *
 * 1. **`motion` remplacé par une transition CSS.** Le registre anime la
 *    pastille avec `motion/react` (`layoutId` + ressort). Deux raisons de ne
 *    pas l'introduire : c'est ~34 ko sur toutes les pages pour une pastille
 *    qui glisse entre trois positions fixes — un `translate-x` fait le même
 *    trajet —, et surtout une animation JavaScript **échappe au bloc
 *    `prefers-reduced-motion` de `globals.css`**, qui ne pilote que du CSS.
 *    C'est exactement le piège déjà payé avec Recharts (doc 05). En CSS, la
 *    préférence s'applique sans que ce fichier ait à y penser.
 *
 * 2. **`useControllableState` de Radix remplacé par `useState`.** Le registre
 *    tire une dépendance de plus pour un composant qui, ici, est toujours
 *    piloté par `next-themes`. Le mode non contrôlé reste disponible, il tient
 *    en une ligne.
 *
 * 3. **Sémantique de groupe de boutons radio, et navigation aux flèches.**
 *    Le registre rend trois `<button>` sans relation : un lecteur d'écran
 *    entend trois commandes indépendantes et ne peut pas dire laquelle est
 *    active. Ce n'est pas qu'une question de conformité — ce composant vit
 *    dans un `DropdownMenu` Radix, **qui ferme le menu sur `Tab`**. Sans
 *    focus glissant aux flèches, les deux dernières options y seraient
 *    inatteignables au clavier. D'où `role="radiogroup"`, `aria-checked`, et
 *    un seul bouton dans l'ordre de tabulation.
 * ────────────────────────────────────────────────────────────────────────────
 */

export type Theme = "system" | "light" | "dark";

export const THEME_ORDER: readonly Theme[] = ["system", "light", "dark"];

const ICONS = {
  system: MonitorIcon,
  light: SunIcon,
  dark: MoonIcon,
} as const;

export interface ThemeSwitcherProps extends Omit<React.ComponentProps<"div">, "onChange"> {
  value?: Theme;
  defaultValue?: Theme;
  onChange?: (theme: Theme) => void;
  /**
   * Libellés lus par les technologies d'assistance, un par thème.
   *
   * Obligatoires et non codés en dur : le registre les livre en anglais, et
   * l'app doit les fournir en fr comme en en. Le pictogramme seul ne dit rien
   * — « soleil » n'est pas « thème clair ».
   */
  labels: Readonly<Record<Theme, string>>;
}

export function ThemeSwitcher({
  value,
  defaultValue = "system",
  onChange,
  labels,
  className,
  ...props
}: ThemeSwitcherProps) {
  const [uncontrolled, setUncontrolled] = React.useState<Theme>(defaultValue);
  const theme = value ?? uncontrolled;

  const buttons = React.useRef<(HTMLButtonElement | null)[]>([]);

  /**
   * Le thème n'est pas connu au rendu serveur — il vient de `localStorage` ou
   * du média. Tant qu'on n'est pas monté, aucune option n'est cochée.
   *
   * Le groupe est quand même rendu, et c'est délibéré : le registre renvoie
   * `null` avant le montage, ce qui fait sauter la mise en page à
   * l'hydratation. Il occupe donc sa place, inerte, exactement comme le fait
   * déjà `theme-toggle.tsx`.
   */
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => setMounted(true), []);

  function select(next: Theme) {
    if (value === undefined) {
      setUncontrolled(next);
    }

    onChange?.(next);
  }

  /**
   * Contrat clavier d'un groupe radio : les flèches déplacent **et**
   * sélectionnent, Origine et Fin vont aux extrémités.
   *
   * `stopPropagation` n'est pas décoratif : sans lui, le `DropdownMenu` qui
   * héberge ce groupe recevrait la même flèche et déplacerait en plus le focus
   * de son propre menu — un appui, deux mouvements.
   */
  function onKeyDown(event: React.KeyboardEvent, index: number) {
    const last = THEME_ORDER.length - 1;

    const target =
      event.key === "ArrowRight" || event.key === "ArrowDown"
        ? (index + 1) % THEME_ORDER.length
        : event.key === "ArrowLeft" || event.key === "ArrowUp"
          ? (index + last) % THEME_ORDER.length
          : event.key === "Home"
            ? 0
            : event.key === "End"
              ? last
              : null;

    if (target === null) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();

    const next = THEME_ORDER[target];

    if (next) {
      select(next);
      buttons.current[target]?.focus();
    }
  }

  const activeIndex = Math.max(0, THEME_ORDER.indexOf(theme));

  return (
    <div
      role="radiogroup"
      className={cn(
        "relative isolate flex h-8 w-fit rounded-full bg-background p-1 ring-1 ring-border",
        className,
      )}
      {...props}
    >
      {/*
        La pastille est un seul élément qui se déplace, et non un fond par
        bouton qui s'allume : c'est ce qui donne le glissement, et ce qui
        évite trois transitions à synchroniser. `aria-hidden` parce qu'elle ne
        dit rien de plus que `aria-checked`.

        `translate-x` par pas de 1,5 rem — la largeur d'un bouton, les trois
        étant de taille fixe. C'est ce qui permet de se passer d'une mesure au
        montage, donc de `motion`.
      */}
      {mounted && (
        <span
          aria-hidden="true"
          className="absolute top-1 left-1 size-6 rounded-full bg-secondary transition-transform duration-200 ease-out"
          style={{ transform: `translateX(${activeIndex * 1.5}rem)` }}
        />
      )}

      {THEME_ORDER.map((key, index) => {
        const Icon = ICONS[key];
        const checked = mounted && theme === key;

        return (
          <button
            key={key}
            ref={(node) => {
              buttons.current[index] = node;
            }}
            type="button"
            role="radio"
            aria-checked={checked}
            aria-label={labels[key]}
            title={labels[key]}
            /*
              Un seul bouton dans l'ordre de tabulation : c'est le focus
              glissant attendu d'un groupe radio, et il évite d'allonger la
              tabulation de deux arrêts qui ne mènent nulle part.
            */
            tabIndex={checked || (!mounted && index === 0) ? 0 : -1}
            onClick={() => select(key)}
            onKeyDown={(event) => onKeyDown(event, index)}
            className="relative size-6 cursor-pointer rounded-full focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
          >
            <Icon
              aria-hidden="true"
              className={cn(
                "relative z-10 m-auto size-4 transition-colors",
                checked ? "text-foreground" : "text-muted-foreground",
              )}
            />
          </button>
        );
      })}
    </div>
  );
}
