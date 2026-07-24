"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Building2, MapPin, UtensilsCrossed, Inbox, MessageSquare, TrendingUp, LogOut, Sun, Moon } from "lucide-react";
import {
  Sidebar, SidebarHeader, SidebarContent, SidebarFooter, SidebarGroup,
  SidebarGroupLabel, SidebarGroupContent, SidebarMenu, SidebarMenuItem,
  SidebarMenuButton, useSidebar,
} from "@/components/ui/sidebar";

type Item = { href: string; label: string; icon: typeof Building2 };
type Group = { label: string; items: Item[] };

function isActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(href + "/");
}

const GROUPS: Group[] = [
  { label: "Catálogo", items: [{ href: "/admin/desarrollos", label: "Desarrollos", icon: Building2 }] },
  {
    label: "Contenido",
    items: [
      { href: "/admin/zonas", label: "Zonas", icon: MapPin },
      { href: "/admin/directorio", label: "Directorio", icon: UtensilsCrossed },
    ],
  },
  {
    label: "Comercial",
    items: [
      { href: "/admin/leads", label: "Leads", icon: Inbox },
      { href: "/admin/keywords", label: "Keywords", icon: TrendingUp },
      { href: "/admin/feedback", label: "Comentarios del sitio", icon: MessageSquare },
    ],
  },
];

export function AppSidebar({
  user,
  logoutAction,
}: {
  user: { name: string; role: string };
  logoutAction: () => void;
}) {
  const pathname = usePathname();
  const { state } = useSidebar();
  const collapsed = state === "collapsed";

  const [light, setLight] = useState(false);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLight(document.documentElement.getAttribute("data-crm-theme") === "light");
  }, []);
  function toggleTheme() {
    const next = !light;
    setLight(next);
    const el = document.documentElement;
    if (next) el.setAttribute("data-crm-theme", "light");
    else el.removeAttribute("data-crm-theme");
    try {
      localStorage.setItem("crm-theme", next ? "light" : "dark");
    } catch {}
  }

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <Link href="/admin/desarrollos" className="flex items-center px-2 py-2" aria-label="Chukum">
          <span className="font-display text-lg tracking-[-0.01em] text-[var(--crm-ink)]">
            {collapsed ? "C" : "Chukum"}
          </span>
        </Link>
      </SidebarHeader>

      <SidebarContent className="crm-scroll">
        {GROUPS.map((g) => (
          <SidebarGroup key={g.label}>
            <SidebarGroupLabel>{g.label}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {g.items.map(({ href, label, icon: Icon }) => (
                  <SidebarMenuItem key={href}>
                    <SidebarMenuButton asChild isActive={isActive(pathname, href)} tooltip={label}>
                      <Link href={href}>
                        <Icon strokeWidth={1.9} />
                        <span>{label}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarFooter>
        {!collapsed && (
          <div className="px-2 pb-1">
            <span className="block truncate text-[13px] font-medium text-[var(--crm-ink-soft)]">{user.name}</span>
          </div>
        )}
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton onClick={toggleTheme} tooltip={light ? "Tema oscuro" : "Tema claro"}>
              {light ? <Moon strokeWidth={1.9} /> : <Sun strokeWidth={1.9} />}
              <span>{light ? "Tema oscuro" : "Tema claro"}</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <form action={logoutAction} className="w-full">
              <SidebarMenuButton asChild tooltip="Salir">
                <button type="submit" aria-label="Salir">
                  <LogOut strokeWidth={1.9} />
                  <span>Salir</span>
                </button>
              </SidebarMenuButton>
            </form>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
