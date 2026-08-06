import { RoutinesWorkspace } from "@/features/routines/routines-workspace";

/**
 * Coquille du segment `/routines` : le volet de navigation à gauche, la route
 * courante à droite (doc 05).
 *
 * Ce fichier reste un Server Component et ne fait qu'assembler : c'est
 * `RoutinesWorkspace` qui passe en client, parce que lui seul a besoin du
 * chemin courant pour décider quel volet montrer sous `xl`.
 */
export default function RoutinesLayout({ children }: { children: React.ReactNode }) {
  return <RoutinesWorkspace>{children}</RoutinesWorkspace>;
}
