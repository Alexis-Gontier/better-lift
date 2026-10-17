import { type ReactNode, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

/** Le côté où du contenu reste caché : le fondu ne s'y pose que là. */
function updateFade(el: HTMLElement) {
  const left = el.scrollLeft > 1;
  const right = el.scrollLeft + el.clientWidth < el.scrollWidth - 1;
  el.dataset.fade = left && right ? "both" : left ? "left" : right ? "right" : "none";
}

/**
 * Une rangée sur une seule ligne, qui défile à l'horizontale : à la molette, au doigt, ou en
 * la saisissant à la souris. Un glisser ne déclenche pas le clic de l'élément relâché. Un fondu
 * marque le bord derrière lequel il reste des éléments.
 */
export function DragScroll({ className, children }: { className?: string; children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const drag = useRef({ active: false, moved: false, x: 0, left: 0 });

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    updateFade(el);
    const observer = new ResizeObserver(() => updateFade(el));
    observer.observe(el);
    if (el.firstElementChild) observer.observe(el.firstElementChild);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={cn(
        "flex cursor-grab touch-pan-x overflow-x-auto [scrollbar-width:none] data-[dragging=true]:cursor-grabbing data-[dragging=true]:*:pointer-events-none",
        "data-[fade=right]:mask-[linear-gradient(to_right,black_calc(100%-3rem),transparent)]",
        "data-[fade=left]:mask-[linear-gradient(to_left,black_calc(100%-3rem),transparent)]",
        "data-[fade=both]:mask-[linear-gradient(to_right,transparent,black_3rem,black_calc(100%-3rem),transparent)]",
        className,
      )}
      onScroll={(e) => updateFade(e.currentTarget)}
      onPointerDownCapture={(e) => {
        if (e.pointerType !== "mouse" || e.button !== 0 || !ref.current) return;
        drag.current = { active: true, moved: false, x: e.clientX, left: ref.current.scrollLeft };
        // Un Select Radix s'ouvre à l'appui de la souris et capte la suite : on le prive de
        // l'appui, il s'ouvre alors au clic — que le glisser annule s'il a eu lieu.
        if ((e.target as HTMLElement).closest("[data-slot=select-trigger]")) e.stopPropagation();
      }}
      onPointerMove={(e) => {
        const d = drag.current;
        if (!d.active || !ref.current) return;
        const dx = e.clientX - d.x;
        if (!d.moved && Math.abs(dx) > 4) {
          d.moved = true;
          ref.current.dataset.dragging = "true";
        }
        if (d.moved) ref.current.scrollLeft = d.left - dx;
      }}
      onPointerUp={() => {
        drag.current.active = false;
        if (ref.current) ref.current.dataset.dragging = "false";
      }}
      onPointerLeave={() => {
        drag.current.active = false;
        if (ref.current) ref.current.dataset.dragging = "false";
      }}
      onClickCapture={(e) => {
        if (drag.current.moved) {
          e.preventDefault();
          e.stopPropagation();
          drag.current.moved = false;
        }
      }}
    >
      {children}
    </div>
  );
}
