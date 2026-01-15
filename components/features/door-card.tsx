"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Unlock, X } from "lucide-react";
import OpenDoorControl from "@/components/features/open-door-control";
import { checkUnitStatus } from "@/app/actions/check-status";
import { rejectCall } from "@/app/actions/reject-call";
import { toast } from "sonner";
import { accessLogs } from "@/db/schema";

type LogType = typeof accessLogs.$inferSelect;

interface DoorCardProps {
  unitId: string;
  initialLog: LogType | undefined | null;
  unitMqttTopic: string | null;
  buildingMqttTopic: string | null;
}

export function DoorCard({
  unitId,
  initialLog,
  unitMqttTopic,
  buildingMqttTopic,
}: DoorCardProps) {
  const router = useRouter();
  const [activeRing, setActiveRing] = useState<LogType | null | undefined>(
    initialLog?.status === "ringing" ? initialLog : null
  );
  const [rejecting, setRejecting] = useState(false);

  // Polling Effect
  useEffect(() => {
    const interval = setInterval(async () => {
      const res = await checkUnitStatus(unitId);

      if (res.isRinging && res.log) {
        // Found a ringing log
        // Update if it's a NEW log OR if we currently have no active ring
        if (!activeRing || activeRing.id !== res.log.id) {
          setActiveRing(res.log);
          router.refresh();
        }
      } else {
        // No ringing log found on server
        // If we currently show a ring, we should clear it (it was handled or timed out)
        if (activeRing) {
          setActiveRing(null);
          router.refresh();
        }
      }
    }, 2000); // Poll every 2 seconds for faster updates

    return () => clearInterval(interval);
  }, [unitId, activeRing, router]);

  const handleReject = async () => {
    if (!activeRing) return;
    setRejecting(true);
    try {
      const res = await rejectCall(activeRing.id);
      if (res.success) {
        toast.success("Llamada rechazada");
        setActiveRing(null); // Immediate UI update
        router.refresh();
      } else {
        toast.error("Error al rechazar");
      }
    } catch {
      toast.error("Error de conexión");
    } finally {
      setRejecting(false);
    }
  };

  return (
    <div className="relative bg-bg-card backdrop-blur-xl border border-border-subtle rounded-2xl overflow-hidden shadow-sm transition-all duration-500">
      {/* Status Indicator */}
      <div
        className={`h-1 w-full ${
          activeRing ? "bg-alert animate-pulse" : "bg-success"
        }`}
      />

      <div className="p-6 flex flex-col items-center gap-6">
        {/* Ringing Visual */}
        {activeRing ? (
          <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-zinc-100 dark:bg-black border border-border-subtle dark:border-white/10 shadow-inner flex flex-col">
            {activeRing.visitorPhotoUrl &&
            !activeRing.visitorPhotoUrl.startsWith("MSG:") ? (
              <>
                <Image
                  src={activeRing.visitorPhotoUrl}
                  alt="Visitor"
                  fill
                  className="object-cover"
                />
                {/* Overlay Message if Photo Exists */}
                {activeRing.message && (
                  <div className="absolute bottom-0 inset-x-0 bg-white/95 dark:bg-black/60 backdrop-blur-sm p-3 text-center border-t border-border-subtle dark:border-white/5">
                    <p className="text-text-main dark:text-white text-sm font-medium italic">
                      "{activeRing.message}"
                    </p>
                  </div>
                )}
              </>
            ) : (
              <div className="h-full w-full flex flex-col items-center justify-center p-6 text-center">
                {activeRing.message ? (
                  <div className="space-y-2">
                    <span className="text-text-muted text-xs uppercase tracking-widest font-bold">
                      Mensaje del Visitante
                    </span>
                    <p className="text-text-main dark:text-white text-xl md:text-2xl font-serif italic leading-relaxed">
                      "{activeRing.message}"
                    </p>
                  </div>
                ) : (
                  <div className="text-zinc-500 flex flex-col items-center gap-2">
                    <span className="text-sm">Cámara desconectada</span>
                  </div>
                )}
              </div>
            )}
            <div className="absolute top-3 left-3 px-2 py-1 bg-alert/80 backdrop-blur text-white text-[10px] font-bold rounded uppercase tracking-wider animate-pulse z-10">
              Live
            </div>
          </div>
        ) : (
          <div className="w-24 h-24 rounded-full bg-zinc-100 dark:bg-zinc-800/50 flex items-center justify-center border border-border-subtle shadow-inner">
            <Unlock className="w-10 h-10 text-text-muted" />
          </div>
        )}

        {/* Status Text */}
        <div className="text-center">
          <h2
            className={`text-xl font-bold ${
              activeRing ? "text-text-main" : "text-text-muted"
            }`}
          >
            {activeRing ? "Están tocando timbre" : "Puerta Segura"}
          </h2>
          <p className="text-sm text-text-muted mt-1">
            {activeRing ? "Autoriza el acceso" : "Sistema de acceso activo"}
          </p>
        </div>

        {/* Actions */}
        {activeRing && (
          <div className="w-full space-y-3 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Option 1: Open Main Gate (If configured) */}
            {buildingMqttTopic && (
              <OpenDoorControl
                key="main-gate"
                logId={activeRing.id}
                type="building"
                label="Entrada Principal"
                onOpenSuccess={() => {
                  setActiveRing(null);
                  router.refresh();
                }}
              />
            )}

            {/* Option 2: Open Unit Door (If configured) */}
            {unitMqttTopic && (
              <OpenDoorControl
                key="unit-door"
                logId={activeRing.id}
                type="unit"
                label={
                  buildingMqttTopic ? "Entrada Departamento" : "Entrada Única"
                }
                className="mt-2"
                onOpenSuccess={() => {
                  setActiveRing(null);
                  router.refresh();
                }}
              />
            )}

            {/* Fallback if no specific configuration (Legacy behavior) */}
            {!buildingMqttTopic && !unitMqttTopic && (
              <OpenDoorControl
                key="default-door"
                logId={activeRing.id}
                type="default"
                label="Entrada Principal"
                onOpenSuccess={() => {
                  setActiveRing(null);
                  router.refresh();
                }}
              />
            )}

            {/* REJECT BUTTON */}
            <div className="pt-2 border-t border-border-subtle mt-4">
              <button
                onClick={handleReject}
                disabled={rejecting}
                className="w-full py-3 rounded-xl flex items-center justify-center gap-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors font-medium text-sm"
              >
                <X className="w-4 h-4" />
                {rejecting ? "Rechazando..." : "Rechazar Entrada"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
