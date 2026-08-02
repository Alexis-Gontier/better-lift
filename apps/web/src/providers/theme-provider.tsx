"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";

/**
 * `defaultTheme="system"` est la lecture littérale de la doc 05 : « respect de
 * `prefers-color-scheme` au premier chargement ». Le « sombre par défaut » de
 * la même phrase décrit l'identité visuelle, pas un forçage — imposer le sombre
 * à quelqu'un dont le système est clair, ce serait justement ne pas respecter
 * la préférence.
 *
 * `attribute="class"` pose `.dark` sur `<html>`, ce que `@custom-variant dark
 * (&:is(.dark *))` attend côté CSS. `disableTransitionOnChange` évite que
 * toutes les couleurs de la page s'animent pendant la bascule.
 *
 * C'est ce provider qui rend `suppressHydrationWarning` obligatoire sur
 * `<html>` (voir `app/layout.tsx`).
 */
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      {children}
    </NextThemesProvider>
  );
}
