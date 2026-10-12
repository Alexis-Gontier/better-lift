import * as basicFit from "./basic-fit/couleurs";
import * as underground from "./underground/couleurs";

/**
 * Les couleurs de chaque thème, sans leurs polices : TypeScript pur, lu par les
 * tests sous Node (`lib/themes.test.ts`). Un nouveau thème s'ajoute ici et dans
 * `themes/index.ts`.
 */
export const couleursDesThemes = { underground, basicFit };
