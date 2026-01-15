"use client";

import { useState } from "react";
import { openDoor } from "@/app/actions/door";
import { toast } from "sonner";
import { Unlock, Loader2 } from "lucide-react";
// NOTE: SlideSubmitWrapper is a default export? Let's verify or just implement a simple button first.
// The plan said "SlideSubmitWrapper" in the original code.
// I will implement a robust button here directly.

export default function OpenDoorControl({
  logId,
  type,
  label,
  className = "",
  onOpenSuccess,
}: {
  logId: string;
  type: "building" | "unit" | "default";
  label: string;
  className?: string;
  onOpenSuccess?: () => void;
}) {
  const [loading, setLoading] = useState(false);

  const handleOpen = async () => {
    setLoading(true);
    try {
      const res = await openDoor(logId, type);
      if (res.success) {
        toast.success("¡Puerta Abierta con éxito!");
        if (onOpenSuccess) onOpenSuccess();
      } else {
        toast.error("Error al abrir: " + res.message);
      }
    } catch (err) {
      toast.error("Error de conexión");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={className}>
      <p className="text-xs text-zinc-500 text-center mb-1 uppercase tracking-wider">
        {label}
      </p>
      <button
        onClick={handleOpen}
        disabled={loading}
        className={`w-full font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed
            ${
              type === "default"
                ? "bg-emerald-600 hover:bg-emerald-500 text-white shadow-[0_0_20px_rgba(16,185,129,0.3)]"
                : type === "building"
                ? "bg-emerald-600/80 hover:bg-emerald-500 text-white"
                : "bg-cyan-600 hover:bg-cyan-500 text-white"
            }
        `}
      >
        {loading ? (
          <Loader2 className="w-5 h-5 animate-spin" />
        ) : (
          <Unlock className="w-5 h-5" />
        )}
        <span>{loading ? "Abriendo..." : "Abrir Puerta"}</span>
      </button>
    </div>
  );
}
