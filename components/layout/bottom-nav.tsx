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
    <nav className="fixed bottom-0 w-full z-50 bg-black/60 backdrop-blur-md border-t border-white/10 pb-safe">
      <div className="flex justify-around items-center h-16">
        {links.map(({ href, icon: Icon, label }) => {
          const isActive =
            pathname === href ||
            (href !== "/dashboard" && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              className="flex flex-col items-center justify-center w-full h-full space-y-1"
            >
              <Icon
                strokeWidth={1.5}
                className={clsx(
                  "w-6 h-6 transition-colors duration-200",
                  isActive ? "text-cyan-400" : "text-zinc-500"
                )}
              />
              <span
                className={clsx(
                  "text-[10px] font-medium tracking-wide transition-colors duration-200",
                  isActive ? "text-cyan-400" : "text-zinc-600"
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
