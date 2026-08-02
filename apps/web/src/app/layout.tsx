import { type Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";

import "@better-lift/ui/globals.css";

import { Providers } from "@/providers";

/*
  `variable` plutôt que `className` : la police est consommée par les tokens
  `--font-sans` et `--font-mono` de `globals.css`, donc par les utilitaires
  Tailwind `font-sans` / `font-mono` / `font-heading`. Passer la classe
  directement court-circuiterait ces tokens et laisserait `font-mono` retomber
  sur la stack système.

  `display: "swap"` est le défaut de `next/font` et on le garde : le texte
  s'affiche immédiatement dans la police de repli plutôt que de rester
  invisible le temps du chargement. Le repli étant lui aussi sans empattement,
  la substitution ne déplace presque rien.
*/
const geistSans = Geist({ subsets: ["latin"], variable: "--font-geist-sans" });
const geistMono = Geist_Mono({ subsets: ["latin"], variable: "--font-geist-mono" });

export const metadata: Metadata = {
  title: "better-lift",
  description: "Tracker de musculation — atelier web",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    /*
      `suppressHydrationWarning` est requis par next-themes : son script pose
      la classe de thème sur `<html>` avant l'hydratation pour éviter le flash
      de thème clair, donc le markup rendu au serveur diffère forcément de
      celui du client sur cet attribut. C'est le seul endroit où l'avertissement
      est légitime — ne pas l'étendre plus bas dans l'arbre.

      Les couleurs de fond et de texte viennent de `@layer base` (`bg-background
      text-foreground`), plus des classes sur `<body>`.
    */
    <html
      lang="fr"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable}`}
    >
      <body className="min-h-screen antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
