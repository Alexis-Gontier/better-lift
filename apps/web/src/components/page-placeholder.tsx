import { Page } from "@/components/page";
import { useProto } from "@/components/proto/use-proto";

type Props = { title: string; description: string };

/** Page-titre de la passe 1 : le gabarit commun et un cadre vide qui dit ce qui viendra. */
export function PagePlaceholder({ title, description }: Props) {
  const { variant, state } = useProto();
  return (
    <Page title={title}>
      <div className="flex min-h-80 flex-1 flex-col items-center justify-center gap-1 rounded-xl border border-dashed p-6 text-center text-muted-foreground text-sm">
        <span>{description}</span>
        <span className="text-xs">
          Variante {variant.toUpperCase()} · état « {state} »
        </span>
      </div>
    </Page>
  );
}
