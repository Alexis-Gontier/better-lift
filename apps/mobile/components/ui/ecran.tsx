import { SafeAreaView } from "react-native-safe-area-context";
import { withUniwind } from "uniwind";

/**
 * Le `SafeAreaView` qui accepte `className` (D316) : Uniwind ne lit les classes
 * que sur les composants de React Native ; un composant tiers passe par
 * `withUniwind`.
 */
export const Ecran = withUniwind(SafeAreaView);
