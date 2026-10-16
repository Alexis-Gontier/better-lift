import { createFileRoute, Outlet } from "@tanstack/react-router";
import { AppSidebar } from "@/components/shell/app-sidebar";
import { CommandPalette } from "@/components/shell/command-palette";
import { ShellDialogsProvider } from "@/components/shell/shell-dialogs";
import { ShortcutListener } from "@/components/shell/shortcut-listener";
import { ShortcutsDialog } from "@/components/shell/shortcuts-dialog";
import { SiteHeader } from "@/components/shell/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";

export const Route = createFileRoute("/_app")({
  component: AppLayout,
});

function AppLayout() {
  return (
    <ShellDialogsProvider>
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <SiteHeader />
          <main className="flex flex-1 flex-col">
            <Outlet />
          </main>
        </SidebarInset>
        <CommandPalette />
        <ShortcutsDialog />
        <ShortcutListener />
      </SidebarProvider>
    </ShellDialogsProvider>
  );
}
