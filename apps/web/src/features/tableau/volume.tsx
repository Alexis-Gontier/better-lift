import { formaterCharge, type StatsPeriode } from "@better-lift/shared";
import { cn } from "cn";
import { SYSTEME_UNITES } from "@/lib/unites";
import { volumesAffiches } from "./calculs";
import { Carte } from "./carte";

/** Le volume par semaine, par mois en Année (D137). La barre courante en encre, jamais en lime. */
export function Volume({ stats }: { stats: StatsPeriode }) {
  const barres = volumesAffiches(stats.volumes, stats.periode);
  const max = Math.max(1, ...barres.map((b) => b.volumeKg));
  const total = barres.reduce((s, b) => s + b.volumeKg, 0);
  const pas = Math.ceil(barres.length / 6);

  return (
    <Carte
      titre={stats.periode === "annee" ? "Volume par mois" : "Volume par semaine"}
      detail={`${formaterCharge(Math.round(total), SYSTEME_UNITES)} sur la période`}
      className="lg:col-span-5"
    >
      <div className="flex h-44 items-end gap-1.5">
        {barres.map((b, i) => {
          const libelle = `${b.libelle} : ${formaterCharge(Math.round(b.volumeKg), SYSTEME_UNITES)}`;
          return (
            <div
              key={b.cle}
              title={libelle}
              className="flex h-full min-w-0 flex-1 flex-col items-center justify-end gap-1.5"
            >
              <span
                className={cn(
                  "w-full rounded-md",
                  b.courante ? "bg-(--ink-muted)" : "bg-(--line-strong)",
                )}
                style={{ height: `${Math.max(2, (b.volumeKg / max) * 100)}%` }}
              />
              {/* Six libellés au plus, comptés depuis la barre courante qui garde le
                  sien : au-delà, ils se chevauchent dans une demi-largeur. */}
              <span className="h-4 text-[10.5px] whitespace-nowrap text-(--ink-subtle)">
                {(barres.length - 1 - i) % pas === 0 ? b.libelle : ""}
              </span>
            </div>
          );
        })}
      </div>
      <p className="sr-only">
        {barres
          .map((b) => `${b.libelle} : ${formaterCharge(Math.round(b.volumeKg), SYSTEME_UNITES)}`)
          .join(", ")}
      </p>
    </Carte>
  );
}
