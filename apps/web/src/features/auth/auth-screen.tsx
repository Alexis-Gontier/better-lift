/**
 * En-tête et rythme vertical communs aux quatre écrans d'authentification.
 *
 * Plus de carte : dans une mise en page en deux colonnes, c'est le panneau qui
 * cadre déjà l'écran. Ajouter une bordure autour du formulaire ferait un double
 * encadrement — le motif « carte centrée sur fond vide » n'a de sens que
 * lorsqu'il n'y a rien d'autre à l'écran, ce qui n'est plus le cas.
 *
 * Le titre est un vrai `<h1>` : c'est le seul de la page, le grand texte du
 * panneau étant un `<p>` justement pour ne pas lui disputer la place.
 */
export function AuthScreen({
  title,
  description,
  children,
}: {
  title: string;
  description: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-7">
      <header className="flex flex-col gap-2">
        <h1 className="font-heading text-3xl leading-tight font-semibold tracking-tight text-balance">
          {title}
        </h1>
        <p className="leading-normal text-muted-foreground text-pretty">{description}</p>
      </header>

      {children}
    </div>
  );
}
