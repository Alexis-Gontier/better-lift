import { Link, useLocation } from "@tanstack/react-router";
import { Settings } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar";
import { NAV_GROUPS } from "./nav";

/** L'entrée est active sur sa page et ses sous-pages ; l'Accueil, seulement sur « / ». */
function isActive(to: string, pathname: string): boolean {
  return to === "/" ? pathname === "/" : pathname === to || pathname.startsWith(`${to}/`);
}

/** Les liens seuls, Paramètres en pied : le reste revient pas à pas. */
export function AppSidebar() {
  const { pathname } = useLocation();
  return (
    <Sidebar collapsible="icon">
      <SidebarHeader />
      <SidebarContent>
        {NAV_GROUPS.map((group) => (
          <SidebarGroup key={group.label ?? "root"}>
            {group.label && <SidebarGroupLabel>{group.label}</SidebarGroupLabel>}
            <SidebarMenu>
              {group.items.map((item) => (
                <SidebarMenuItem key={item.to}>
                  <SidebarMenuButton
                    asChild
                    tooltip={item.title}
                    isActive={isActive(item.to, pathname)}
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
        ))}
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              tooltip="Paramètres"
              isActive={isActive("/settings", pathname)}
            >
              <Link to="/settings/account">
                <Settings />
                <span>Paramètres</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
