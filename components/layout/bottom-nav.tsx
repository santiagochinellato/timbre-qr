"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, History, Key, User } from "lucide-react";
import { clsx } from "clsx";

export function BottomNav() {
  const pathname = usePathname();

  const links = [
    { href: "/dashboard", icon: Home, label: "Inicio" },
    { href: "/dashboard/activity", icon: History, label: "Actividad" },
    { href: "/dashboard/properties", icon: Key, label: "Accesos" },
    { href: "/dashboard/profile", icon: User, label: "Perfil" },
  ];

  return (
    <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[90%] max-w-sm z-50">
      <div className="bg-zinc-900/90 backdrop-blur-2xl border border-white/10 rounded-full shadow-[0_8px_32px_rgba(0,0,0,0.4)] px-2 py-2 flex justify-between items-center">
        {links.map(({ href, icon: Icon, label }) => {
          const isActive =
            pathname === href ||
            (href !== "/dashboard" && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              className={clsx(
                "relative flex flex-col items-center justify-center w-full h-12 rounded-full transition-all duration-300",
                isActive ? "text-white" : "text-zinc-500 hover:text-zinc-300"
              )}
            >
              {isActive && (
                <div className="absolute inset-0 bg-white/10 rounded-full -z-10 animate-in fade-in zoom-in duration-200" />
              )}
              <Icon
                strokeWidth={isActive ? 2.5 : 2}
                className={clsx(
                  "w-5 h-5 transition-transform duration-200",
                  isActive ? "scale-110" : "scale-100"
                )}
              />
              <span
                className={clsx(
                  "text-[9px] font-medium tracking-wide mt-0.5 transition-colors duration-200",
                  isActive ? "text-white" : "text-zinc-500"
                )}
              >
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
