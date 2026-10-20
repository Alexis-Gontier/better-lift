import Svg, { G, Rect } from "react-native-svg";
import { useCSSVariable } from "uniwind";

/**
 * Le logo « La charge » (D322, D326) : la tuile de l'icône de l'app, dessinée aux couleurs du
 * thème — `primary` pour la tuile, `primary-foreground` pour le symbole —, donc inversée en
 * sombre comme le favicon du web (D323). Mêmes cotes que `assets/logo.svg`.
 */
export function Logo({ taille }: { taille: number }) {
  const tuile = useCSSVariable("--color-primary") as string;
  const symbole = useCSSVariable("--color-primary-foreground") as string;
  return (
    <Svg width={taille} height={taille} viewBox="0 0 256 256" accessible={false}>
      <Rect width={256} height={256} rx={57.6} fill={tuile} />
      <G
        fill={symbole}
        transform="translate(128 128) rotate(-45) scale(0.8822) translate(-128 -128)"
      >
        <Rect x={42} y={120} width={12} height={16} />
        <Rect x={52} y={96} width={28} height={64} rx={6} />
        <Rect x={86} y={72} width={32} height={112} rx={6} />
        <Rect x={124} y={44} width={36} height={168} rx={6} />
        <Rect x={158} y={108} width={18} height={40} rx={3} />
        <Rect x={174} y={120} width={40} height={16} />
      </G>
    </Svg>
  );
}
