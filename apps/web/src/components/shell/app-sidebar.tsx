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
import { isActive, NAV_GROUPS } from "./nav";

/** Pas encore de logo : le nom en texte, masqué quand la barre est repliée. */
export function AppSidebar() {
  const { pathname } = useLocation();
  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="h-12 justify-center px-4">
        <Link
          to="/"
          className="truncate font-semibold text-lg tracking-tight group-data-[collapsible=icon]:hidden"
        >
          better-lift
        </Link>
      </SidebarHeader>
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
