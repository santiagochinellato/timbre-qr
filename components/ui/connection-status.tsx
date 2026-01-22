"use client";

import { useRealtime } from "@/components/providers/realtime-provider";
import { cn } from "@/lib/utils";
import { WifiOff } from "lucide-react";

export function ConnectionStatus({ className }: { className?: string }) {
  const { isConnected, forceReconnect } = useRealtime();

  return (
    <button
      onClick={isConnected ? undefined : forceReconnect}
      className={cn(
        "flex items-center gap-2 px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all border",
        isConnected
          ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
          : "bg-red-500/10 text-red-500 border-red-500/20 hover:bg-red-500/20 cursor-pointer",
        className,
      )}
      title={
        isConnected
          ? "Conectado al servidor en tiempo real"
          : "Desconectado - Clic para reconectar"
      }
    >
      {isConnected ? (
        <>
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span className="hidden sm:inline">En Vivo</span>
        </>
      ) : (
        <>
          <WifiOff className="w-3 h-3" />
          <span>Desconectado</span>
        </>
      )}
    </button>
  );
}
