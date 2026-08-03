/**
 * Logos des fournisseurs OAuth, en SVG inline.
 *
 * Pas de `lucide-react` ici : ses icônes sont un trait de contour uniforme, ce
 * qui est exactement ce qu'il faut pour une interface et exactement ce qu'il ne
 * faut pas pour une marque. Un bouton « Continuer avec GitHub » se reconnaît à
 * la forme du logo, avant même d'être lu — un pictogramme générique annule ce
 * repère.
 *
 * Inline plutôt qu'en fichier : un chemin de moins de 1 ko, chargé avec le
 * bouton, sans requête ni décalage de mise en page.
 *
 * `aria-hidden` : le nom du fournisseur est déjà dans le libellé du bouton, le
 * lire deux fois n'apporte rien.
 */

export function GitHubMark(props: React.ComponentProps<"svg">) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
      <path d="M12 .3a12 12 0 0 0-3.8 23.4c.6.1.8-.3.8-.6v-2.2c-3.3.7-4-1.6-4-1.6-.6-1.4-1.4-1.8-1.4-1.8-1.1-.7.1-.7.1-.7 1.2.1 1.9 1.3 1.9 1.3 1.1 1.8 2.8 1.3 3.5 1 .1-.8.4-1.3.8-1.6-2.7-.3-5.5-1.3-5.5-6 0-1.3.5-2.4 1.2-3.2-.1-.3-.5-1.5.1-3.2 0 0 1-.3 3.3 1.2a11.5 11.5 0 0 1 6 0c2.3-1.5 3.3-1.2 3.3-1.2.6 1.7.2 2.9.1 3.2.8.8 1.2 1.9 1.2 3.2 0 4.7-2.8 5.7-5.5 6 .4.4.8 1.1.8 2.2v3.3c0 .3.2.7.8.6A12 12 0 0 0 12 .3Z" />
    </svg>
  );
}
