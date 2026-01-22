"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Unlock, X, MessageSquare, Camera } from "lucide-react";
import OpenDoorControl from "@/components/features/open-door-control";
import dynamic from "next/dynamic";
const CameraFeed = dynamic(
  () => import("./camera-feed").then((mod) => mod.CameraFeed),
  {
    ssr: false,
    loading: () => <div className="w-full h-full bg-zinc-900 animate-pulse" />,
  },
);
import { LiveCameraModal } from "@/components/features/live-camera-modal";
import { useDoorbell } from "@/components/hooks/use-doorbell";
import { DbAccessLog } from "@/lib/types";
import { ConnectionStatus } from "@/components/ui/connection-status";

interface DoorCardProps {
  unitId: string;
  initialLog: DbAccessLog | undefined | null;
  unitMqttTopic: string | null;
  buildingMqttTopic: string | null;
  cameraUrl?: string | null;
}

export function DoorCard({
  unitId,
  initialLog,
  unitMqttTopic,
  buildingMqttTopic,
  cameraUrl,
}: DoorCardProps) {
  const router = useRouter();

  // Custom Hook for Logic
  const {
    activeRing,
    rejecting,
    responding,
    responseSent,
    handleReject,
    handleSendResponse,
    resetResponseSent,
  } = useDoorbell(unitId, initialLog);

  // UI State for Camera/Photo View
  const [isLiveModalOpen, setIsLiveModalOpen] = useState(false);

  // Fallback to env var logic (UI specific)
  const isInvalidDbUrl =
    !cameraUrl ||
    (!cameraUrl.startsWith("ws") && !cameraUrl.startsWith("http"));

  const effectiveCameraUrl = !isInvalidDbUrl
    ? cameraUrl
    : process.env.NEXT_PUBLIC_WS_URL ||
      "wss://video-service-production-44b4.up.railway.app";

  // View Mode Logic: Derived with User Override
  const [userOverrideMode, setUserOverrideMode] = useState<
    "camera" | "photo" | null
  >(null);

  const viewMode =
    userOverrideMode || (activeRing?.visitorPhotoUrl ? "photo" : "camera");

  const setViewMode = (mode: "camera" | "photo") => setUserOverrideMode(mode);

  // Reset override on new ring using derived state pattern
  const [prevRingId, setPrevRingId] = useState<string | undefined>(
    activeRing?.id,
  );
  if (activeRing?.id !== prevRingId) {
    setPrevRingId(activeRing?.id);
    setUserOverrideMode(null);
  }

  // Reset response sent status when activeRing changes
  useEffect(() => {
    if (!activeRing) resetResponseSent();
  }, [activeRing, resetResponseSent]);

  const [customResponse, setCustomResponse] = useState("");

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
          <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-black shadow-inner border border-border-subtle dark:border-white/10 group">
            {viewMode === "camera" && effectiveCameraUrl ? (
              <CameraFeed url={effectiveCameraUrl} className="w-full h-full" />
            ) : viewMode === "photo" && activeRing?.visitorPhotoUrl ? (
              <img
                src={activeRing.visitorPhotoUrl}
                className="w-full h-full object-cover"
                alt="Visitor"
              />
            ) : (
              <div className="w-full h-full bg-zinc-900 flex items-center justify-center">
                <div className="w-16 h-16 rounded-full bg-zinc-800 animate-pulse flex items-center justify-center">
                  <Camera className="text-zinc-500 w-8 h-8" />
                </div>
              </div>
            )}

            {effectiveCameraUrl && (
              <div className="absolute top-2 right-2 z-20">
                <button
                  onClick={() => setIsLiveModalOpen(true)}
                  className="bg-black/50 hover:bg-black/70 backdrop-blur-md text-white px-3 py-1.5 rounded-full text-xs font-bold border border-white/20 flex items-center gap-2 transition-colors"
                >
                  <Camera className="w-3 h-3" /> Ver Cámara en Vivo
                </button>
              </div>
            )}

            <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-80" />

            {activeRing.message && (
              <div className="absolute bottom-4 left-4 right-4 animate-in slide-in-from-bottom-2 fade-in duration-500">
                <div className="bg-black/40 backdrop-blur-md border border-white/10 p-3 rounded-lg">
                  <span className="text-white/60 text-[10px] font-bold uppercase tracking-wider block mb-1">
                    Mensaje del Visitante
                  </span>
                  <p className="text-white text-lg font-serif italic leading-snug">
                    &quot;{activeRing.message}&quot;
                  </p>
                </div>
              </div>
            )}
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
          <div className="mt-4 flex justify-center">
            <ConnectionStatus />
          </div>
        </div>

        {/* Actions */}
        {activeRing && (
          <div className="w-full space-y-3 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {buildingMqttTopic && (
              <OpenDoorControl
                key="main-gate"
                logId={activeRing.id}
                type="building"
                label="Entrada Principal"
                onOpenSuccess={() => router.refresh()}
              />
            )}

            {unitMqttTopic && (
              <OpenDoorControl
                key="unit-door"
                logId={activeRing.id}
                type="unit"
                label={
                  buildingMqttTopic ? "Entrada Departamento" : "Entrada Única"
                }
                className="mt-2"
                onOpenSuccess={() => router.refresh()}
              />
            )}

            {!buildingMqttTopic && !unitMqttTopic && (
              <OpenDoorControl
                key="default-door"
                logId={activeRing.id}
                type="default"
                label="Entrada Principal"
                onOpenSuccess={() => router.refresh()}
              />
            )}

            {/* RESPONSE SECTION */}
            <div className="pt-4 border-t border-border-subtle mt-2 space-y-3">
              <div className="flex items-center gap-2 text-text-muted text-xs font-bold uppercase tracking-wider">
                <MessageSquare className="w-3 h-3" />
                Respuesta Rápida
              </div>

              {!responseSent ? (
                <>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      "Ya bajo",
                      "Dame 5 minutos",
                      "Enseguida estoy",
                      "Vuelva luego",
                    ].map((msg) => (
                      <button
                        key={msg}
                        onClick={() => handleSendResponse(msg)}
                        disabled={responding}
                        className="px-3 py-2 bg-zinc-100 dark:bg-white/5 hover:bg-zinc-200 dark:hover:bg-white/10 rounded-lg text-xs font-medium text-text-main transition-colors border border-transparent hover:border-border-subtle"
                      >
                        {msg}
                      </button>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Mensaje personalizado..."
                      value={customResponse}
                      onChange={(e) => setCustomResponse(e.target.value)}
                      className="flex-1 bg-zinc-50 dark:bg-black/20 border border-border-subtle rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary/50 outline-none"
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && customResponse.trim()) {
                          handleSendResponse(customResponse.trim());
                        }
                      }}
                    />
                    <button
                      onClick={() =>
                        customResponse.trim() &&
                        handleSendResponse(customResponse.trim())
                      }
                      disabled={responding || !customResponse.trim()}
                      className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-bold hover:bg-primary/90 disabled:opacity-50"
                    >
                      &gt;
                    </button>
                  </div>
                </>
              ) : (
                <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-3 text-center">
                  <p className="text-emerald-500 text-sm font-medium">
                    ¡Mensaje enviado al visitante!
                  </p>
                </div>
              )}
            </div>

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

      <LiveCameraModal
        isOpen={isLiveModalOpen}
        onClose={() => setIsLiveModalOpen(false)}
        streamUrl={effectiveCameraUrl || ""}
      />
    </div>
  );
}
