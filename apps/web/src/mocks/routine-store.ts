import { type MockRoutine, mockRoutines } from "./routines";
import { signal } from "./signal";

/**
 * Les routines de la maquette, que l'Historique lit encore (« Voir la routine »). Les Routines,
 * elles, lisent l'API ; ce module part au lot Historique.
 */
const routines = signal<MockRoutine[]>(mockRoutines);

export const useRoutines = routines.use;
