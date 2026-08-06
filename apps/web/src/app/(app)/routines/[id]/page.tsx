import { type Metadata } from "next";

import { BackToList } from "@/features/routines/back-to-list";
import { RoutineEdit } from "@/features/routines/routine-edit";

export const metadata: Metadata = { title: "Routine — better-lift" };

/**
 * Une routine s'ouvre **directement en modification**.
 *
 * Il y avait auparavant un aperçu en lecture seule, et un bouton « Modifier »
 * pour en sortir. Deux écrans pour la même chose : l'aperçu montrait exercices,
 * séries et charges cibles, l'éditeur montre exactement les mêmes valeurs dans
 * des champs. Personne ne vient consulter une routine pour le plaisir — on
 * l'ouvre pour ajuster une charge ou ajouter une série, et le bouton
 * « Modifier » était un péage entre l'intention et le geste.
 *
 * Ce que l'aperçu apportait — voir la routine sans risquer de la changer — est
 * conservé par l'éditeur lui-même : rien n'est envoyé avant l'enregistrement
 * explicite, et la barre de modifications ne s'affiche qu'une fois quelque
 * chose touché. Ouvrir puis repartir ne modifie rien.
 */
export default async function RoutinePage({ params }: { params: Promise<{ id: string }> }) {
  // Next 16 : `params` est une promesse, y compris dans un Server Component.
  const { id } = await params;

  return (
    <div className="space-y-6">
      <BackToList />

      <RoutineEdit id={id} />
    </div>
  );
}
