"use client";

import { MonitorIcon, MoonIcon, SunIcon } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

import { Button } from "@better-lift/ui/components/button";

/**
 * Bascule de thème.
 *
 * Trois états et non deux : « système » est une valeur à part entière, pas
 * l'absence de choix. Une bascule clair/sombre binaire enferme définitivement
 * qui l'a touchée une fois — il n'y a plus de retour à `prefers-color-scheme`,
 * et l'app cesse de suivre le passage automatique au sombre du soir.
 */
const ORDER = ["system", "light", "dark"] as const;

const LABELS = {
  system: "Thème : système",
  light: "Thème : clair",
  dark: "Thème : sombre",
} as const;

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  /**
   * Le thème n'est pas connu au rendu serveur : il vient de `localStorage` ou
   * du média. Rendre une icône avant l'hydratation garantit qu'elle sera fausse
   * la moitié du temps, puis remplacée — d'où le montage.
   *
   * Le bouton est quand même rendu, vide et désactivé, plutôt que `null` : il
   * occupe déjà sa place, donc l'en-tête ne se réagence pas à l'hydratation.
   * C'est du décalage de mise en page en moins, sur le tout premier écran.
   */
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return <Button variant="ghost" size="icon" disabled aria-hidden="true" />;
  }

  const current = ORDER.includes(theme as (typeof ORDER)[number])
    ? (theme as (typeof ORDER)[number])
    : "system";
  const next = ORDER[(ORDER.indexOf(current) + 1) % ORDER.length] ?? "system";

  return (
    <Button
      variant="ghost"
      size="icon"
      /*
        Le libellé annonce l'état **courant**, pas la cible : c'est ce que le
        pictogramme montre, et les deux doivent dire la même chose. Le titre,
        lui, annonce l'action — c'est le rôle de l'infobulle.
      */
      aria-label={LABELS[current]}
      title={`${LABELS[current]} — passer en ${LABELS[next].toLowerCase().replace("thème : ", "")}`}
      onClick={() => setTheme(next)}
    >
      {current === "system" && <MonitorIcon />}
      {current === "light" && <SunIcon />}
      {current === "dark" && <MoonIcon />}
    </Button>
  );
}
