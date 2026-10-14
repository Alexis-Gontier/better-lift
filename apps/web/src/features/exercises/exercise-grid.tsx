import type { ExerciceResume } from "@better-lift/shared";
import { Link } from "@tanstack/react-router";
import { useEffect, useRef } from "react";

export type Practice = { nbSeances: number; derniere: string };

/** Une carte de la grille (D200) : image, nom, muscle ciblé · équipement, pratiques. */
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
      className="group flex w-full aria-[current=page]:translate-x-boxShadowX aria-[current=page]:translate-y-boxShadowY aria-[current=page]:bg-muted aria-[current=page]:shadow-none flex-col overflow-hidden rounded-base border-2 border-border bg-secondary-background shadow-shadow outline-none transition-all hover:translate-x-boxShadowX hover:translate-y-boxShadowY hover:shadow-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
    >
      {/* L'image FIXE (~6 Ko, D46) : la grille montre des dizaines de cartes à la fois. */}
      <div className="aspect-[4/3] border-b-2 border-border bg-image-bg">
        {exercise.image ? (
          <img src={exercise.image} alt="" loading="lazy" className="size-full object-contain" />
        ) : null}
      </div>
      <div className="flex flex-1 flex-col gap-1 p-3">
        <span className="line-clamp-2 font-bold leading-tight">{exercise.nom}</span>
        <span className="text-xs text-muted-foreground">
          {exercise.cible} · {exercise.equipement}
        </span>
        {practice ? (
          // Un contour, pas un aplat : c'est une information, pas une action (D28).
          <span className="mt-1 w-fit rounded-base border-2 border-main bg-main/15 px-1.5 text-[11px] font-bold text-main-ink">
            ×{practice.nbSeances}
          </span>
        ) : null}
      </div>
    </Link>
  );
}

/** La grille ; un repère en bas de page charge la suite quand il devient visible. */
export function ExerciseGrid({
  selectedSlug,
  exercises,
  practiced,
  hasMore,
  onMore,
}: {
  selectedSlug?: string;
  exercises: ExerciceResume[];
  practiced: Map<string, Practice>;
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

  return (
    <>
      <ul className="grid grid-cols-[repeat(auto-fill,minmax(11rem,1fr))] gap-4">
        {exercises.map((e) => (
          <li key={e.slug} className="flex">
            <ExerciseCard
              exercise={e}
              practice={practiced.get(e.slug)}
              selected={e.slug === selectedSlug}
            />
          </li>
        ))}
      </ul>
      {hasMore ? <div ref={sentinel} className="h-px" /> : null}
    </>
  );
}
