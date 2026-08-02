import Link from "next/link";

import { AuthPanel } from "@/features/auth/auth-panel";
import { ThemeToggle } from "@/features/theme/theme-toggle";

/**
 * Coquille des écrans d'authentification (doc 05).
 *
 * Deux colonnes à partir de `lg` : le panneau éditorial à gauche, le formulaire
 * à droite. Sous `lg`, le panneau disparaît entièrement et la colonne du
 * formulaire occupe l'écran — c'est la même mise en page, pas une variante
 * mobile à maintenir en parallèle.
 *
 * Aucune navigation dans l'en-tête : à ce stade du parcours, tout lien qui
 * n'est pas l'action en cours est une occasion de partir. La marque fait
 * exception, parce qu'un logo qui ne ramène nulle part est un piège plus qu'une
 * sortie. La bascule de thème aussi : c'est le seul endroit où elle est
 * atteignable avant d'avoir un compte.
 */
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    /*
      35 / 65 et non 50 / 50 : à parts égales, le formulaire fait 384 px au
      milieu d'une colonne de 720, et les deux moitiés cessent de se lire comme
      une composition — ce sont deux îlots séparés par du vide. Resserrer sa
      colonne la remplit et donne au panneau la place que son texte demande.

      `minmax(30rem, 35%)` et non `35%` sec : au seuil `lg` (1024 px), 35 % vaut
      358 px, soit moins que le formulaire lui-même — il serait comprimé. Le
      plancher de 480 px le garde entier, et le pourcentage ne reprend la main
      qu'à partir de ~1370 px, où il devient le plus grand des deux.
    */
    <div className="grid min-h-screen lg:grid-cols-[1fr_minmax(30rem,35%)]">
      {/*
        Le formulaire est **premier dans le DOM** et déplacé à droite par
        `lg:order-2`. L'ordre visuel change, pas l'ordre de lecture : un lecteur
        d'écran et la touche Tab suivent le DOM, et faire entendre trois
        arguments marketing avant d'atteindre le champ e-mail serait un obstacle
        pour la seule personne qui ne peut pas sauter la colonne du regard.
      */}
      <div className="flex flex-col px-4 py-6 sm:px-8 lg:order-2">
        <header className="flex items-center justify-between gap-4">
          <Link
            href="/"
            /*
              Les capitales viennent de `uppercase`, pas du texte source. Écrire
              « BETTER-LIFT » en dur ferait épeler le mot lettre par lettre à
              certains lecteurs d'écran ; la transformation CSS laisse le nom
              accessible intact. `tracking-wide` est indissociable : des
              capitales au crénage d'un texte en bas de casse se touchent.
            */
            className="inline-flex rounded-md text-lg font-bold tracking-wide uppercase outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            better-lift
          </Link>

          <ThemeToggle />
        </header>

        {/*
          `py-10` et non un centrage strict : sur un écran court, un contenu
          parfaitement centré finit collé aux bords. La marge garantit qu'il
          respire, et `flex-1` le recentre dès qu'il y a la place.
        */}
        <main className="flex flex-1 items-center justify-center py-10">
          {/*
            L'animation d'entrée vient de `tw-animate-css`. Elle n'a pas besoin
            de `motion-safe:` : le bloc `prefers-reduced-motion` de `globals.css`
            ramène toutes les durées à ~0 en amont, pour toute l'app.
          */}
          <div className="w-full max-w-sm animate-in fade-in slide-in-from-bottom-2 duration-500">
            {children}
          </div>
        </main>

        <footer className="text-xs text-muted-foreground">
          Gratuit, sans publicité, sans revente de données.
        </footer>
      </div>

      <AuthPanel />
    </div>
  );
}
