"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  History,
  Key,
  User,
  LifeBuoy,
  MoreHorizontal,
  Settings,
} from "lucide-react";
import { clsx } from "clsx";
import { ModeToggle } from "@/components/mode-toggle";

export function BottomNav({ role }: { role?: string }) {
  const pathname = usePathname();
  const [isMoreOpen, setIsMoreOpen] = useState(false);

  // Close menu when route changes
  useEffect(() => {
    setIsMoreOpen(false);
  }, [pathname]);

  const mainLinks = [
    { href: "/dashboard", icon: Home, label: "Inicio" },
    { href: "/dashboard/properties", icon: Key, label: "Accesos" },
    { href: "/dashboard/activity", icon: History, label: "Actividad" },
  ];

  const moreLinks = [
    { href: "/dashboard/profile", icon: User, label: "Perfil" },
    { href: "/dashboard/support", icon: LifeBuoy, label: "Soporte" },
    ...(role === "admin"
      ? [{ href: "/dashboard/settings", icon: Settings, label: "Ajustes" }]
      : []),
  ];

  return (
    <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[90%] max-w-sm z-50">
      {/* More Menu Popup */}
      {isMoreOpen && (
        <div className="absolute bottom-full mb-3 right-0 w-48 bg-white/90 dark:bg-zinc-900/90 backdrop-blur-2xl border border-zinc-200 dark:border-white/10 rounded-2xl shadow-xl overflow-hidden animate-in slide-in-from-bottom-2 fade-in duration-200 origin-bottom-right">
          <div className="flex flex-col p-1">
            {moreLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={clsx(
                  "flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/10 transition-colors",
                  pathname === link.href
                    ? "text-zinc-900 dark:text-white bg-zinc-100 dark:bg-white/5"
                    : "text-zinc-500 dark:text-zinc-400"
                )}
              >
                <link.icon className="w-5 h-5" />
                <span className="text-sm font-medium">{link.label}</span>
              </Link>
            ))}
            <div className="h-px bg-zinc-100 dark:bg-white/5 my-1" />
            <div className="px-4 py-2 flex justify-center">
              <ModeToggle />
            </div>
          </div>
        </div>
      )}

      {/* Main Bar */}
      <div className="bg-white/90 dark:bg-zinc-900/90 backdrop-blur-2xl border border-zinc-200 dark:border-white/10 rounded-full shadow-[0_8px_32px_rgba(0,0,0,0.1)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.4)] px-2 py-2 flex justify-between items-center relative">
        {mainLinks.map(({ href, icon: Icon, label }) => {
          const isActive =
            pathname === href ||
            (href !== "/dashboard" && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              className={clsx(
                "relative flex flex-col items-center justify-center w-full h-12 rounded-full transition-all duration-300",
                isActive
                  ? "text-zinc-900 dark:text-white"
                  : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
              )}
            >
              {isActive && (
                <div className="absolute inset-0 bg-zinc-100 dark:bg-white/10 rounded-full -z-10 animate-in fade-in zoom-in duration-200" />
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
                  isActive ? "text-zinc-900 dark:text-white" : "text-zinc-500"
                )}
              >
                {label}
              </span>
            </Link>
          );
        })}

        {/* More Button */}
        <button
          onClick={() => setIsMoreOpen(!isMoreOpen)}
          className={clsx(
            "relative flex flex-col items-center justify-center w-full h-12 rounded-full transition-all duration-300",
            isMoreOpen
              ? "text-zinc-900 dark:text-white"
              : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
          )}
        >
          {isMoreOpen && (
            <div className="absolute inset-0 bg-zinc-100 dark:bg-white/10 rounded-full -z-10 animate-in fade-in zoom-in duration-200" />
          )}
          <MoreHorizontal
            strokeWidth={isMoreOpen ? 2.5 : 2}
            className={clsx(
              "w-5 h-5 transition-transform duration-200",
              isMoreOpen ? "scale-110" : "scale-100"
            )}
          />
          <span
            className={clsx(
              "text-[9px] font-medium tracking-wide mt-0.5 transition-colors duration-200",
              isMoreOpen ? "text-zinc-900 dark:text-white" : "text-zinc-500"
            )}
          >
            Más
          </span>
        </button>
      </div>
    </nav>
  );
}
