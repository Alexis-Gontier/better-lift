import { type Metadata } from "next";

import "@better-lift/ui/globals.css";

import { Providers } from "@/providers";

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
    <html lang="fr" suppressHydrationWarning>
      <body className="min-h-screen antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
