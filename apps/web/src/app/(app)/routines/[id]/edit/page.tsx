import { permanentRedirect } from "next/navigation";

/**
 * `/routines/:id/edit` n'existe plus comme écran : la routine s'ouvre
 * directement en modification sur `/routines/:id`.
 *
 * La route est conservée en redirection plutôt que supprimée. Elle a circulé —
 * favoris, historique de navigateur, et surtout `safeNextPath` qui la restitue
 * après une reconnexion (`/login?next=/routines/42/edit`). Une 404 y serait un
 * cul-de-sac gratuit alors que la destination est connue sans ambiguïté.
 *
 * `permanentRedirect` et non `redirect` : c'est un 308, la relation est
 * définitive, et un client qui la met en cache a raison de le faire.
 */
export default async function EditRoutineRedirect({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  permanentRedirect(`/routines/${id}`);
}
