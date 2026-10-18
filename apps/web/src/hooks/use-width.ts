import { useEffect, useState } from "react";

/** La largeur d'un élément, suivie au redimensionnement ; `null` tant qu'il n'est pas monté. */
export function useWidth(el: HTMLElement | null): number | null {
  const [width, setWidth] = useState<number | null>(null);
  useEffect(() => {
    if (!el) return;
    const observer = new ResizeObserver((entries) =>
      setWidth(entries[0]?.contentRect.width ?? null),
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [el]);
  return width;
}
