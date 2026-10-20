import { Link, useLocation } from "@tanstack/react-router";
import { Brand } from "@/components/brand";
import { Logo } from "@/components/logo";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar";
import { NAV_ITEMS } from "./nav";

/** L'entrée est active sur sa page et ses sous-pages ; l'Accueil, seulement sur « / ». */
function isActive(to: string, pathname: string): boolean {
  return to === "/" ? pathname === "/" : pathname === to || pathname.startsWith(`${to}/`);
}

/** Les liens seuls, pour l'instant : le reste revient pas à pas. */
export function AppSidebar() {
  const { pathname } = useLocation();
  return (
    <Sidebar collapsible="icon">
      {/* Le symbole et le nom (D329), sur la hauteur du header. Le symbole (20 px) est centré
          sur la colonne des icônes du menu, le nom commence au même x que leurs libellés ;
          repliée, la barre ne laisse que le symbole. Le nom n'est pas masqué mais rogné, pour
          suivre la largeur pendant l'animation. */}
      <SidebarHeader className="h-12 justify-center">
        <Link
          to="/"
          aria-label="better-lift, accueil"
          className="flex items-center gap-1.5 overflow-hidden whitespace-nowrap rounded-md px-1.5 outline-hidden ring-sidebar-ring focus-visible:ring-2"
        >
          <Logo className="size-5" />
          <Brand />
        </Link>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarMenu>
            {NAV_ITEMS.map((item) => (
              <SidebarMenuItem key={item.to}>
                <SidebarMenuButton
                  asChild
                  tooltip={item.title}
                  isActive={isActive(item.to, pathname)}
                  // Gris par défaut, noir sur la page courante ; même graisse dans les deux cas.
                  className="font-normal text-muted-foreground data-active:font-normal data-active:text-foreground"
                >
                  <Link to={item.to}>
                    <item.icon />
                    <span>{item.title}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter />
      <SidebarRail />
    </Sidebar>
  );
}
