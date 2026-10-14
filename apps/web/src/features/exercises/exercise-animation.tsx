import { ATTRIBUTION_MEDIAS } from "@better-lift/shared";
import { useState } from "react";

/**
 * L'animation d'un exercice (D46).
 *
 * Le GIF reste dans le dépôt du dataset : on l'affiche, on ne le copie pas. Il
 * appartient à Gym visual, d'où la mention SOUS le cadre (visible, exigée par la
 * permission de Gym visual, mais hors de l'image), et la taille bornée
 * à 180×180 — la résolution à laquelle il est distribué.
 *
 * L'appelant passe `key={gif}` : changer d'exercice remonte le composant, ce qui
 * remet `echec` à faux sans effet à écrire.
 */
export function ExerciseAnimation({ gif, name }: { gif: string | null; name: string }) {
  const [failure, setFailure] = useState(false);

  // Le repli : pas d'URL, ou une URL qui n'a pas chargé. Rien plutôt qu'une
  // image cassée — la fiche reste complète sans visuel.
  if (!gif || failure) return null;

  return (
    <figure className="flex w-fit flex-col gap-1.5">
      <img
        src={gif}
        alt={`Animation de l'exercice : ${name}`}
        width={180}
        height={180}
        loading="lazy"
        onError={() => setFailure(true)}
        className="size-45 rounded-base border-2 border-border bg-image-bg object-contain shadow-shadow"
      />
      <figcaption className="text-[10px] text-muted-foreground">{ATTRIBUTION_MEDIAS}</figcaption>
    </figure>
  );
}
