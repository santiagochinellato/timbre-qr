"use client";

import { useState, useEffect } from "react";
import { Moon, Sun, Laptop } from "lucide-react";
import { useTheme } from "next-themes";

export function ModeToggle() {
  const { setTheme, theme: resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Prevent hydration mismatch by defaulting to undefined until mounted
  const theme = mounted ? resolvedTheme : undefined;

  return (
    <div className="flex items-center gap-2 border border-border-subtle rounded-full p-1 bg-bg-card">
      <button
        onClick={() => setTheme("light")}
        className={`p-2 rounded-full transition-colors ${
          theme === "light"
            ? "bg-bg-app text-text-main shadow-sm"
            : "text-text-muted hover:text-text-main"
        }`}
        aria-label="Light Mode"
      >
        <Sun className="h-4 w-4" />
      </button>
      <button
        onClick={() => setTheme("dark")}
        className={`p-2 rounded-full transition-colors ${
          theme === "dark"
            ? "bg-bg-app text-text-main shadow-sm"
            : "text-text-muted hover:text-text-main"
        }`}
        aria-label="Dark Mode"
      >
        <Moon className="h-4 w-4" />
      </button>
      <button
        onClick={() => setTheme("system")}
        className={`p-2 rounded-full transition-colors ${
          theme === "system"
            ? "bg-bg-app text-text-main shadow-sm"
            : "text-text-muted hover:text-text-main"
        }`}
        aria-label="System Mode"
      >
        <Laptop className="h-4 w-4" />
      </button>
    </div>
  );
}
