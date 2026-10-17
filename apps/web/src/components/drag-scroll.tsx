import { type ReactNode, useRef } from "react";
import { cn } from "@/lib/utils";

/**
 * Une rangée sur une seule ligne, qui défile à l'horizontale : à la molette, au doigt, ou en
 * la saisissant à la souris. Un glisser ne déclenche pas le clic de l'élément relâché.
 */
export function DragScroll({ className, children }: { className?: string; children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const drag = useRef({ active: false, moved: false, x: 0, left: 0 });

  return (
    <div
      ref={ref}
      className={cn(
        "flex cursor-grab touch-pan-x overflow-x-auto [scrollbar-width:none] data-[dragging=true]:cursor-grabbing data-[dragging=true]:*:pointer-events-none",
        className,
      )}
      onPointerDown={(e) => {
        if (e.pointerType !== "mouse" || e.button !== 0 || !ref.current) return;
        drag.current = { active: true, moved: false, x: e.clientX, left: ref.current.scrollLeft };
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
