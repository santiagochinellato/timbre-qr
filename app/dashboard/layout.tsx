import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { PushManager } from "@/components/push-manager";
import { LiveStatusPoller } from "@/components/features/live-status-poller";
import { BottomNav } from "@/components/layout/bottom-nav";
import { PushPermissionBanner } from "@/components/features/push-permission-banner";
import Link from "next/link";
import { ModeToggle } from "@/components/mode-toggle";
import { Home, Key, DoorOpen, Settings, LifeBuoy } from "lucide-react";
import Image from "next/image";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  return (
    <div className="flex min-h-screen bg-bg-app text-text-main font-sans">
      {/* Desktop Sidebar (Hidden on Mobile/Tablet) */}
      <aside className="hidden lg:flex w-64 flex-col border-r border-border-subtle bg-bg-app p-6 sticky top-0 h-screen">
        <div className="flex items-center gap-2 mb-10 pl-2">
          <Image
            src="/icons/lleguelogo.png"
            alt="Llegue Logo"
            width={160}
            height={60}
            className="w-auto h-16 object-contain"
          />
        </div>

        <nav className="flex-1 space-y-2">
          <NavItem href="/dashboard" icon={Home} label="Inicio" />
          <NavItem
            href="/dashboard/properties"
            icon={Key}
            label="Mis Propiedades"
          />
          <NavItem
            href="/dashboard/activity"
            icon={DoorOpen}
            label="Actividad"
          />
          <NavItem href="/dashboard/support" icon={LifeBuoy} label="Soporte" />
          {(session.user as any).role === "admin" && (
            <NavItem
              href="/dashboard/settings"
              icon={Settings}
              label="Configuración"
            />
          )}
        </nav>

        <div className="mt-auto border-t border-border-subtle pt-6 flex flex-col gap-4">
          <div className="flex justify-center w-full">
            <ModeToggle />
          </div>

          <Link
            href="/dashboard/profile"
            className="flex items-center gap-3 hover:bg-white/5 p-2 rounded-lg transition-colors group"
          >
            <div className="w-10 h-10 rounded-full bg-zinc-200 dark:bg-zinc-800 flex items-center justify-center text-primary font-bold border border-zinc-200 dark:border-white/5 group-hover:border-primary/50 transition-colors">
              {session.user.name?.charAt(0) || "U"}
            </div>
            <div>
              <div className="text-sm font-medium group-hover:text-primary transition-colors">
                {session.user.name}
              </div>
              <div className="text-xs text-text-muted">Residente</div>
            </div>
          </Link>
          {/* <SignOutButton /> */}
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 relative flex flex-col min-h-0 w-full lg:max-w-[calc(100vw-16rem)] overflow-y-auto">
        <PushManager />
        <LiveStatusPoller />
        {/* Soft Permission Prompt */}
        <PushPermissionBanner />

        <div className="flex-1 p-4 md:p-8 pb-24 md:pb-8">{children}</div>
      </main>

      {/* Mobile/Tablet Bottom Nav */}
      <div className="lg:hidden">
        <BottomNav role={(session.user as any).role} />
      </div>
    </div>
  );
}

function NavItem({
  href,
  icon: Icon,
  label,
}: {
  href: string;
  icon: React.ElementType;
  label: string;
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 px-4 py-3 rounded-xl text-text-muted hover:text-text-main dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-all duration-200"
    >
      <Icon className="w-5 h-5" />
      <span className="text-sm font-medium">{label}</span>
    </Link>
  );
}
