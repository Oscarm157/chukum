import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import { logout } from "@/app/actions/auth";
import { AppSidebar } from "./AppSidebar";
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { Toaster } from "@/components/ui/sonner";
import { FlashToaster } from "@/components/crm/FlashToaster";
import { Asistente } from "@/components/crm/Asistente";

// Gate de todo el grupo (panel): un solo admin. Sin login → /login; con contraseña
// temporal → /change-password (rutas ya existentes en chukum).
export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  const me = await getCurrentUser();
  if (!me) redirect("/login");
  if (me.mustChangePassword) redirect("/change-password");
  if (me.role !== "admin") redirect("/");

  return (
    <SidebarProvider>
      <AppSidebar user={{ name: me.name, role: me.role }} logoutAction={logout} />
      <SidebarInset className="crm-inset">
        <header className="sticky top-0 z-10 flex h-14 shrink-0 items-center gap-2 border-b border-[var(--crm-line)] bg-[var(--crm-bg)]/80 px-4 backdrop-blur">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-1 h-5" />
          <span className="text-[13px] font-medium text-[var(--crm-ink-soft)]">Chukum · Panel</span>
        </header>
        <main className="mx-auto w-full max-w-[1380px] px-4 py-7 pb-24 sm:px-7 sm:py-8 sm:pb-8">{children}</main>
      </SidebarInset>
      <Suspense fallback={null}>
        <Asistente />
      </Suspense>
      <Toaster position="bottom-right" />
      <Suspense fallback={null}>
        <FlashToaster />
      </Suspense>
    </SidebarProvider>
  );
}
