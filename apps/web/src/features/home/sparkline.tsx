import { cn } from "@/lib/utils";

/**
 * Une tendance sans axe ni grille, en SVG, à la couleur du texte (`currentColor`). `bars` pour
 * des comptes (séances, records), `area` pour une grandeur continue (volume). Le dernier point,
 * la période en cours, est appuyé.
 */
export function Sparkline({
  values,
  kind,
  className,
}: {
  values: number[];
  kind: "bars" | "area";
  className?: string;
}) {
  const W = 100;
  const H = 32;
  const max = Math.max(...values, 1);
  const n = values.length;
  const y = (v: number) => H - (v / max) * (H - 2);

  if (kind === "bars") {
    const slot = W / n;
    const bar = slot * 0.62;
    return (
      <svg
        viewBox={`0 0 ${W} ${H}`}
        preserveAspectRatio="none"
        className={cn("block w-full", className)}
        aria-hidden
      >
        {values.map((v, i) => (
          <rect
            key={i}
            x={i * slot + (slot - bar) / 2}
            y={v > 0 ? y(v) : H - 1}
            width={bar}
            height={v > 0 ? H - y(v) : 1}
            rx={0.8}
            fill="currentColor"
            opacity={i === n - 1 ? 1 : v > 0 ? 0.35 : 0.15}
          />
        ))}
      </svg>
    );
  }

  const step = n > 1 ? W / (n - 1) : W;
  const points = values.map((v, i) => `${(i * step).toFixed(2)},${y(v).toFixed(2)}`);
  const line = `M${points.join(" L")}`;
  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      preserveAspectRatio="none"
      className={cn("block w-full", className)}
      aria-hidden
    >
      <path d={`${line} L${W},${H} L0,${H} Z`} fill="currentColor" opacity={0.12} />
      <path
        d={line}
        fill="none"
        stroke="currentColor"
        strokeWidth={1.5}
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}
