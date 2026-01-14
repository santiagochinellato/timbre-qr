"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, Lock, LockOpen, Wifi, Power } from "lucide-react";
import {
  simulatePhysicalRing,
  checkLatestOpenCommand,
} from "@/app/actions/simulator";
import { toast } from "sonner";

export function VirtualDevice({
  unitId,
  label,
}: {
  unitId: string;
  label: string;
}) {
  const [status, setStatus] = useState<"idle" | "ringing" | "open">("idle");
  const [logId, setLogId] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);

  // Poll for open command if we have an active Ring Log ID
  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (logId && status !== "open") {
      interval = setInterval(async () => {
        const res = await checkLatestOpenCommand(logId);
        if (res.open) {
          setStatus("open");
          toast.success("🔓 COMANDO RECIBIDO: Abrir Puerta");
          // Reset to idle after 5 seconds (simulating solenoid timeout)
          setTimeout(() => {
            setStatus("idle");
            setLogId(null);
          }, 5000);
        }
      }, 2000);
    }

    return () => clearInterval(interval);
  }, [logId, status]);

  const handleRing = async () => {
    if (isPending) return;
    setIsPending(true);

    // Optimistic UI
    toast("🔔 Enviando señal...");

    const res = await simulatePhysicalRing(unitId);

    setIsPending(false);

    if (res.success) {
      toast.success("Señal enviada al servidor");
      setStatus("ringing");
      if (res.logId) setLogId(res.logId);
    } else {
      toast.error("Error al enviar señal");
    }
  };

  return (
    <div className="relative w-full max-w-md mx-auto aspect-[3/5] bg-zinc-900 rounded-[3rem] border-8 border-zinc-800 shadow-2xl overflow-hidden flex flex-col p-6">
      {/* Device Header/Status Bar */}
      <div className="flex justify-between items-center mb-10 px-2 opacity-70">
        <div className="flex items-center gap-2 text-emerald-400">
          <Wifi className="w-4 h-4" />
          <span className="text-xs font-mono font-bold">ONLINE</span>
        </div>
        <div className="flex items-center gap-2 text-zinc-500">
          <Power className="w-4 h-4" />
          <span className="text-xs font-mono">BAT 100%</span>
        </div>
      </div>

      {/* Main Display Area */}
      <div className="flex-1 flex flex-col items-center justify-center gap-8 z-10">
        {/* Status Indicator (Lock) */}
        <div className="relative">
          <AnimatePresence mode="wait">
            {status === "open" ? (
              <motion.div
                key="unlock"
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.5, opacity: 0 }}
                className="w-32 h-32 rounded-full bg-emerald-500/20 border-2 border-emerald-500 flex items-center justify-center shadow-[0_0_50px_rgba(16,185,129,0.5)]"
              >
                <LockOpen className="w-16 h-16 text-emerald-400" />
              </motion.div>
            ) : (
              <motion.div
                key="lock"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className={`w-32 h-32 rounded-full flex items-center justify-center border-2 transition-colors duration-500 ${
                  status === "ringing"
                    ? "bg-amber-500/10 border-amber-500/50 shadow-[0_0_30px_rgba(245,158,11,0.3)]"
                    : "bg-red-500/10 border-red-500/30"
                }`}
              >
                <Lock
                  className={`w-12 h-12 transition-colors duration-500 ${
                    status === "ringing" ? "text-amber-500" : "text-red-500"
                  }`}
                />
              </motion.div>
            )}
          </AnimatePresence>

          {status === "idle" && (
            <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 text-xs font-mono text-zinc-600 uppercase tracking-widest whitespace-nowrap">
              Sistema Bloqueado
            </div>
          )}
          {status === "ringing" && (
            <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 text-xs font-mono text-amber-500 uppercase tracking-widest whitespace-nowrap animate-pulse">
              Esperando Apertura...
            </div>
          )}
        </div>

        {/* Physical Button Simulator */}
        <div className="mt-12 w-full flex flex-col items-center gap-4">
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={handleRing}
            disabled={isPending || status === "open"}
            className={`
                    relative w-24 h-24 rounded-full border-4 flex items-center justify-center
                    transition-all duration-300 group
                    ${
                      status === "ringing"
                        ? "bg-amber-500 border-amber-600 shadow-[0_0_40px_rgba(245,158,11,0.6)]"
                        : "bg-zinc-800 border-zinc-700 hover:border-cyan-500 hover:shadow-[0_0_30px_rgba(6,182,212,0.3)]"
                    }
                `}
          >
            {/* Ripple Effect Container */}
            <div className="absolute inset-0 rounded-full overflow-hidden">
              {isPending && (
                <div className="absolute inset-0 bg-white/20 animate-ping rounded-full" />
              )}
            </div>

            <Bell
              className={`w-10 h-10 transition-colors ${
                status === "ringing"
                  ? "text-white fill-white"
                  : "text-zinc-400 group-hover:text-cyan-400"
              }`}
            />
          </motion.button>

          <div className="text-center">
            <h3 className="text-white font-bold text-lg tracking-tight">
              TIMBRE
            </h3>
            <p className="text-zinc-500 text-sm">{label}</p>
          </div>
        </div>
      </div>

      {/* Decorative Reflections */}
      <div className="absolute top-0 right-0 w-full h-full bg-gradient-to-tr from-transparent via-transparent to-white/5 pointer-events-none rounded-[2.5rem]" />
    </div>
  );
}
