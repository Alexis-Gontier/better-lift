/**
 * Logos des fournisseurs OAuth, en SVG inline.
 *
 * Pas de `lucide-react` ici : ses icônes sont un trait de contour uniforme, ce
 * qui est exactement ce qu'il faut pour une interface et exactement ce qu'il ne
 * faut pas pour une marque. Un bouton « Continuer avec Google » se reconnaît à
 * la forme et aux couleurs du logo, avant même d'être lu — un pictogramme
 * générique annule ce repère.
 *
 * Inline plutôt qu'en fichier : deux chemins de moins de 1 ko chacun, chargés
 * avec le bouton, sans requête ni décalage de mise en page.
 *
 * `aria-hidden` sur les deux : le nom du fournisseur est déjà dans le libellé
 * du bouton, le lire deux fois n'apporte rien.
 */

export function GitHubMark(props: React.ComponentProps<"svg">) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
      <path d="M12 .3a12 12 0 0 0-3.8 23.4c.6.1.8-.3.8-.6v-2.2c-3.3.7-4-1.6-4-1.6-.6-1.4-1.4-1.8-1.4-1.8-1.1-.7.1-.7.1-.7 1.2.1 1.9 1.3 1.9 1.3 1.1 1.8 2.8 1.3 3.5 1 .1-.8.4-1.3.8-1.6-2.7-.3-5.5-1.3-5.5-6 0-1.3.5-2.4 1.2-3.2-.1-.3-.5-1.5.1-3.2 0 0 1-.3 3.3 1.2a11.5 11.5 0 0 1 6 0c2.3-1.5 3.3-1.2 3.3-1.2.6 1.7.2 2.9.1 3.2.8.8 1.2 1.9 1.2 3.2 0 4.7-2.8 5.7-5.5 6 .4.4.8 1.1.8 2.2v3.3c0 .3.2.7.8.6A12 12 0 0 0 12 .3Z" />
    </svg>
  );
}

/** Le « G » officiel, en quatre chemins — d'où le `fill` par chemin. */
export function GoogleMark(props: React.ComponentProps<"svg">) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" {...props}>
      <path
        fill="#4285F4"
        d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5a5.6 5.6 0 0 1-2.4 3.6v3h3.9c2.3-2.1 3.5-5.2 3.5-8.8Z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.2 0 5.9-1.1 7.9-2.9l-3.9-3c-1 .7-2.4 1.1-4 1.1-3.1 0-5.7-2-6.6-4.8H1.4v3C3.4 21.3 7.4 24 12 24Z"
      />
      <path fill="#FBBC05" d="M5.4 14.4a7.2 7.2 0 0 1 0-4.6v-3H1.4a12 12 0 0 0 0 10.7l4-3.1Z" />
      <path
        fill="#EA4335"
        d="M12 4.7c1.8 0 3.4.6 4.6 1.8l3.4-3.4C17.9 1.2 15.2 0 12 0 7.4 0 3.4 2.7 1.4 6.6l4 3.1C6.3 6.9 8.9 4.7 12 4.7Z"
      />
    </svg>
  );
}
