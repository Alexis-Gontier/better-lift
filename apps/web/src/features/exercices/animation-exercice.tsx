import { ATTRIBUTION_MEDIAS } from "@better-lift/shared";
import { useState } from "react";

/**
 * L'animation d'un exercice (D46).
 *
 * Le GIF reste dans le dépôt du dataset : on l'affiche, on ne le copie pas. Il
 * appartient à Gym visual, d'où la mention sous le visuel, et la taille bornée
 * à 180×180 — la résolution à laquelle il est distribué.
 *
 * L'appelant passe `key={gif}` : changer d'exercice remonte le composant, ce qui
 * remet `echec` à faux sans effet à écrire.
 */
export function AnimationExercice({ gif, nom }: { gif: string | null; nom: string }) {
  const [echec, setEchec] = useState(false);

  // Le repli : pas d'URL, ou une URL qui n'a pas chargé. Rien plutôt qu'une
  // image cassée — la fiche reste complète sans visuel.
  if (!gif || echec) return null;

  return (
    <figure className="flex flex-col items-center gap-1.5">
      <img
        src={gif}
        alt={`Animation de l'exercice : ${nom}`}
        width={180}
        height={180}
        loading="lazy"
        onError={() => setEchec(true)}
        className="size-45 rounded-md bg-white object-contain"
      />
      <figcaption className="text-[11px] text-muted-foreground">{ATTRIBUTION_MEDIAS}</figcaption>
    </figure>
  );
}
