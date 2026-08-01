import { resolveMediaUrl } from "./media";

/**
 * Vignette ou animation d'un exercice, avec son repli.
 *
 * Le repli n'est pas un cas dégradé exotique : aujourd'hui **aucun média n'est
 * servi** (voir `media.ts`), et les exercices personnalisés n'en auront jamais.
 * C'est donc l'état nominal, et il doit rester présentable — d'où une pastille
 * neutre portant l'initiale plutôt qu'une icône d'image cassée.
 *
 * Pas de `next/image` ici : la source est un CDN externe dont l'hôte est choisi
 * au seed, donc inconnu au build, et un GIF d'animation ne gagne rien à
 * traverser l'optimiseur. Le `alt` est vide parce que le nom de l'exercice est
 * lu juste à côté — le répéter ferait doublon au lecteur d'écran.
 */
export function ExerciseMedia({
  url,
  name,
  className = "",
}: {
  url: string | null;
  name: string;
  className?: string;
}) {
  const resolved = resolveMediaUrl(url);

  if (!resolved) {
    return (
      <div
        className={`flex items-center justify-center bg-white/5 text-ink-muted ${className}`}
        aria-hidden
      >
        <span className="text-lg font-semibold">{name.slice(0, 1).toUpperCase()}</span>
      </div>
    );
  }

  return (
    // biome-ignore lint/performance/noImgElement: hôte du CDN choisi au seed, donc inconnu au build
    <img src={resolved} alt="" loading="lazy" className={`object-cover ${className}`} />
  );
}

/**
 * Mention de copyright des médias. Obligatoire **partout où un média apparaît**
 * (D17, doc 08) : la valeur vient de la base et transite par l'API précisément
 * pour qu'un écran ne puisse pas l'oublier.
 *
 * Elle n'est affichée que si un média l'est aussi — sans visuel, il n'y a rien
 * à attribuer, et une mention orpheline sous une pastille grise n'informerait
 * personne.
 */
export function MediaAttribution({ attribution }: { attribution: string | null }) {
  if (!attribution) {
    return null;
  }

  return <p className="text-xs text-ink-muted">{attribution}</p>;
}
