import { SidebarTrigger } from "@/components/ui/sidebar";
import { AppBreadcrumb } from "./app-breadcrumb";

/** Le bouton qui replie la sidebar, puis le fil d'Ariane. */
export function SiteHeader() {
  return (
    <header className="sticky top-0 z-10 flex h-12 shrink-0 items-center gap-2 border-b bg-background px-4">
      <SidebarTrigger className="-ml-1" />
      <AppBreadcrumb />
    </header>
  );
}
