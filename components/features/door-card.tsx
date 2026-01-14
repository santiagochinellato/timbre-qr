"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Unlock, RefreshCw } from "lucide-react";
import OpenDoorControl from "@/components/features/open-door-control";
import { checkUnitStatus } from "@/app/actions/check-status";
import { accessLogs } from "@/db/schema"; // Type only if needed, can infer

// Define types locally if not available easily from schema in client
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
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Polling Effect
  useEffect(() => {
    const interval = setInterval(async () => {
      // setIsRefreshing(true); // Don't show visual loader on every poll, too distracting
      const res = await checkUnitStatus(unitId);

      if (res.isRinging && res.log) {
        // If we found a ringing log
        if (!activeRing || activeRing.id !== res.log.id) {
          setActiveRing(res.log);
          router.refresh(); // Sync server state too if needed
        }
      } else {
        // If not ringing anymore
        if (activeRing) {
          setActiveRing(null);
          router.refresh();
        }
      }
      // setIsRefreshing(false);
    }, 3000); // Check every 3 seconds

    return () => clearInterval(interval);
  }, [unitId, activeRing, router]);

  return (
    <div className="relative bg-bg-card backdrop-blur-xl border border-border-subtle rounded-2xl overflow-hidden shadow-2xl transition-all duration-500">
      {/* Status Indicator */}
      <div
        className={`h-1 w-full ${
          activeRing ? "bg-alert animate-pulse" : "bg-success"
        }`}
      />

      <div className="p-6 flex flex-col items-center gap-6">
        {/* Ringing Visual */}
        {activeRing ? (
          <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-black border border-white/10 shadow-inner flex flex-col">
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
                  <div className="absolute bottom-0 inset-x-0 bg-black/60 backdrop-blur-sm p-3 text-center">
                    <p className="text-white text-sm font-medium italic">
                      "{activeRing.message}"
                    </p>
                  </div>
                )}
              </>
            ) : (
              <div className="h-full w-full flex flex-col items-center justify-center p-6 text-center">
                {activeRing.message ? (
                  <div className="space-y-2">
                    <span className="text-zinc-500 text-xs uppercase tracking-widest font-bold">
                      Mensaje del Visitante
                    </span>
                    <p className="text-white text-xl md:text-2xl font-serif italic leading-relaxed">
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
          <div className="w-24 h-24 rounded-full bg-zinc-800/50 flex items-center justify-center border border-white/5">
            <Unlock className="w-10 h-10 text-zinc-600" />
          </div>
        )}

        {/* Status Text */}
        <div className="text-center">
          <h2
            className={`text-xl font-bold ${
              activeRing ? "text-white" : "text-zinc-500"
            }`}
          >
            {activeRing ? "Están tocando timbre" : "Puerta Segura"}
          </h2>
          <p className="text-sm text-zinc-400 mt-1">
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
              />
            )}

            {/* Fallback if no specific configuration (Legacy behavior) */}
            {!buildingMqttTopic && !unitMqttTopic && (
              <OpenDoorControl
                key="default-door"
                logId={activeRing.id}
                type="default"
                label="Entrada Principal"
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
}
