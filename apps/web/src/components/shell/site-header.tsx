import { SidebarTrigger } from "@/components/ui/sidebar";

/** Vide pour l'instant : seul le bouton qui replie la sidebar. */
export function SiteHeader() {
  return (
    <header className="sticky top-0 z-10 flex h-12 shrink-0 items-center gap-2 border-b bg-background px-4">
      <SidebarTrigger className="-ml-1" />
    </header>
  );
}
