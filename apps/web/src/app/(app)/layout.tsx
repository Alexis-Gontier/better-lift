import Link from "next/link";

/**
 * Layout de la zone authentifiée. La sidebar et la topbar de la doc 05
 * viendront avec les écrans qu'elles ont à porter ; à ce stade il n'y a qu'une
 * page, et une navigation vers une seule destination n'est pas une navigation.
 *
 * Aucune vérification de session ici : c'est `proxy.ts` qui écarte les
 * visiteurs anonymes en amont, et l'API qui fait autorité en aval.
 */
export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto flex min-h-screen w-full max-w-3xl flex-col gap-8 px-6 py-12">
      <header className="flex items-baseline justify-between">
        <Link href="/dashboard" className="text-lg font-semibold tracking-tight">
          better-lift
        </Link>
      </header>
      {children}
    </div>
  );
}
