import { useProto } from "@/components/proto/use-proto";

type Props = { title: string; description: string };

/** Page-titre de la passe 1 : contenu centré, grand titre, un cadre vide. */
export function PagePlaceholder({ title, description }: Props) {
  const { variant, state } = useProto();
  return (
    <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-6 pt-12 pb-10">
      <div className="flex flex-col gap-1">
        <h1 className="font-semibold text-3xl tracking-tight">{title}</h1>
        <p className="text-muted-foreground text-sm">{description}</p>
      </div>
      <div className="flex min-h-64 flex-1 items-center justify-center rounded-xl border border-dashed text-muted-foreground text-sm">
        Zone à dessiner — variante {variant.toUpperCase()}, état « {state} »
      </div>
    </div>
  );
}
