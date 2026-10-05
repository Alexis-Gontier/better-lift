import type { Ref } from "react";
import { Pressable, type PressableProps, type View } from "react-native";

/** L'opacité d'un élément sous le doigt. */
const APPUYE = { opacity: 0.6 } as const;

/**
 * Un `Pressable` qui répond au doigt (audit UI) : en salle, avec des doigts
 * humides, un appui sans retour visuel se refait — et coche deux fois.
 *
 * Un style passé en FONCTION (`({ pressed }) => …`) dit que l'appelant dessine
 * lui-même son état appuyé : rien n'est ajouté. Sinon, l'élément pâlit le temps
 * de l'appui. Une opacité plutôt que l'ondulation Android : elle suit les coins
 * arrondis, que l'ondulation déborde.
 *
 * Seuls les voiles sous les feuilles restent des `Pressable` nus.
 */
export function Appuyable({ style, ref, ...props }: PressableProps & { ref?: Ref<View> }) {
  return (
    <Pressable
      ref={ref}
      {...props}
      style={
        typeof style === "function"
          ? style
          : ({ pressed }) => [style, pressed && !props.disabled ? APPUYE : null]
      }
    />
  );
}
