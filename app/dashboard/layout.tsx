import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { PushManager } from "@/components/push-manager";
import { BottomNav } from "@/components/layout/bottom-nav";
import { PushPermissionBanner } from "@/components/features/push-permission-banner";
import Link from "next/link";
import { Home, Key, DoorOpen, LogOut } from "lucide-react";

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
      {/* Desktop Sidebar (Hidden on Mobile) */}
      <aside className="hidden md:flex w-64 flex-col border-r border-border-subtle bg-bg-app p-6 sticky top-0 h-screen">
        <div className="flex items-center gap-2 mb-10">
          <div className="w-8 h-8 bg-primary rounded-lg shadow-[0_0_15px_var(--color-primary)] flex items-center justify-center">
            <span className="font-bold text-black text-lg">G</span>
          </div>
          <h1 className="text-xl font-bold tracking-tight">Gbellz</h1>
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
        </nav>

        <div className="mt-auto border-t border-border-subtle pt-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center text-primary font-bold">
              {session.user.name?.charAt(0) || "U"}
            </div>
            <div>
              <div className="text-sm font-medium">{session.user.name}</div>
              <div className="text-xs text-text-muted">Residente</div>
            </div>
          </div>
          {/* <SignOutButton /> */}
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 relative flex flex-col min-h-0 w-full md:max-w-[calc(100vw-16rem)] overflow-y-auto">
        <PushManager />
        {/* Soft Permission Prompt */}
        <PushPermissionBanner />

        <div className="flex-1 p-4 md:p-8 pb-24 md:pb-8">{children}</div>
      </main>

      {/* Mobile Bottom Nav */}
      <div className="md:hidden">
        <BottomNav />
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
  icon: any;
  label: string;
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 px-4 py-3 rounded-xl text-text-muted hover:text-white hover:bg-zinc-900 transition-all duration-200"
    >
      <Icon className="w-5 h-5" />
      <span className="text-sm font-medium">{label}</span>
    </Link>
  );
}
