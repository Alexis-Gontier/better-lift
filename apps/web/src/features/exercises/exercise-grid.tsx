import type { ExerciceResume } from "@better-lift/shared";
import { Link } from "@tanstack/react-router";
import { useEffect, useRef } from "react";

export type Practice = { nbSeances: number; derniere: string };

/**
 * Une carte de la grille (D200), compacte : l'image carrée à gauche, le texte à droite, sur
 * une hauteur FIXE. La pastille ×N se range au bout de la ligne muscle · équipement : sa
 * présence ne change ni la hauteur ni l'alignement, avec ou sans « Mes exercices ».
 */
export function ExerciseCard({
  exercise,
  practice,
  selected = false,
}: {
  exercise: ExerciceResume;
  practice?: Practice;
  selected?: boolean;
}) {
  return (
    <Link
      to="/exercises/$slug"
      params={{ slug: exercise.slug }}
      search={(s) => s}
      aria-current={selected ? "page" : undefined}
      // La carte ouverte est enfoncée dans son ombre, sur une surface en retrait :
      // une sélection, jamais l'orange de l'action (D160).
      className="flex h-20 w-full overflow-hidden rounded-base border-2 border-border bg-secondary-background shadow-shadow outline-none transition-all hover:translate-x-boxShadowX hover:translate-y-boxShadowY hover:shadow-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background aria-[current=page]:translate-x-boxShadowX aria-[current=page]:translate-y-boxShadowY aria-[current=page]:bg-muted aria-[current=page]:shadow-none"
    >
      {/* L'image FIXE (~6 Ko, D46) : la grille montre des dizaines de cartes à la fois. */}
      <div className="aspect-square h-full shrink-0 border-r-2 border-border bg-image-bg">
        {exercise.image ? (
          <img src={exercise.image} alt="" loading="lazy" className="size-full object-contain" />
        ) : null}
      </div>
      <div className="flex min-w-0 flex-1 flex-col justify-between px-3 py-2">
        <span className="line-clamp-2 text-sm font-bold leading-tight">{exercise.nom}</span>
        <span className="flex items-center gap-2 text-xs text-muted-foreground">
          <span className="truncate">
            {exercise.cible} · {exercise.equipement}
          </span>
          {practice ? (
            // Un contour, pas un aplat : une information, pas une action (D28).
            <span
              className="ml-auto shrink-0 rounded-base border-2 border-main bg-main/15 px-1.5 text-[11px] leading-4 font-bold text-main-ink"
              title={`Pratiqué en ${practice.nbSeances} séance${practice.nbSeances > 1 ? "s" : ""}`}
            >
              ×{practice.nbSeances}
            </span>
          ) : null}
        </span>
      </div>
    </Link>
  );
}

/**
 * La grille ; un repère en bas de page charge la suite quand il devient visible. Quand tes
 * exercices ouvrent le catalogue (`headCount`, D210), deux titres disent où finit ta pratique
 * et où commence le reste : sans eux, l'ordre semblerait arbitraire.
 */
export function ExerciseGrid({
  selectedSlug,
  exercises,
  practiced,
  headCount = 0,
  hasMore,
  onMore,
}: {
  selectedSlug?: string;
  exercises: ExerciceResume[];
  practiced: Map<string, Practice>;
  headCount?: number;
  hasMore: boolean;
  onMore: () => void;
}) {
  const sentinel = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = sentinel.current;
    if (!el || !hasMore) return;
    const observer = new IntersectionObserver((entries) => {
      if (entries.some((e) => e.isIntersecting)) onMore();
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, [hasMore, onMore]);

  const cards = (list: ExerciceResume[]) => (
    <ul className="grid grid-cols-[repeat(auto-fill,minmax(17rem,1fr))] gap-3">
      {list.map((e) => (
        <li key={e.slug} className="flex">
          <ExerciseCard
            exercise={e}
            practice={practiced.get(e.slug)}
            selected={e.slug === selectedSlug}
          />
        </li>
      ))}
    </ul>
  );
  const rest = exercises.slice(headCount);

  return (
    <>
      {headCount > 0 ? (
        <div className="flex flex-col gap-6">
          <section className="flex flex-col gap-3" aria-labelledby="grid-mine">
            <h2 id="grid-mine" className="text-xs font-bold text-muted-foreground uppercase">
              Tes exercices · {headCount}
            </h2>
            {cards(exercises.slice(0, headCount))}
          </section>
          {rest.length ? (
            <section className="flex flex-col gap-3" aria-labelledby="grid-rest">
              <h2 id="grid-rest" className="text-xs font-bold text-muted-foreground uppercase">
                Le reste du catalogue
              </h2>
              {cards(rest)}
            </section>
          ) : null}
        </div>
      ) : (
        cards(exercises)
      )}
      {hasMore ? <div ref={sentinel} className="h-px" /> : null}
    </>
  );
}
