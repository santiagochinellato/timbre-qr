"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Unlock, X, MessageSquare, Camera } from "lucide-react";
import OpenDoorControl from "@/components/features/open-door-control";
import { CameraFeed } from "./camera-feed";
// import { ServerlessCameraView } from "@/components/features/serverless-camera-view";
import { LiveCameraModal } from "@/components/features/live-camera-modal"; // Import
import { sendResponse } from "@/app/actions/send-response";
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
  cameraUrl?: string | null;
}

export function DoorCard({
  unitId,
  initialLog,
  unitMqttTopic,
  buildingMqttTopic,
  cameraUrl,
}: DoorCardProps) {
  // Fallback to env var if database URL is missing OR if it's a localhost testing URL OR a raw RTSP url (browsers can't play it)
  const isInvalidDbUrl =
    !cameraUrl ||
    cameraUrl.includes("localhost") ||
    cameraUrl.includes("127.0.0.1") ||
    cameraUrl.startsWith("rtsp://");
  const effectiveCameraUrl = !isInvalidDbUrl
    ? cameraUrl
    : process.env.NEXT_PUBLIC_CAMERA_WS_URL;

  if (typeof window !== "undefined") {
    console.log("[DoorCard] Database URL:", cameraUrl);
    console.log("[DoorCard] Is Invalid/Stale:", isInvalidDbUrl);
    console.log(
      "[DoorCard] Env Var URL:",
      process.env.NEXT_PUBLIC_CAMERA_WS_URL,
    );
    console.log("[DoorCard] Effective URL:", effectiveCameraUrl);
  }

  const router = useRouter();
  const [activeRing, setActiveRing] = useState<LogType | null | undefined>(
    initialLog?.status === "ringing" ? initialLog : null,
  );
  const [rejecting, setRejecting] = useState(false);
  const [responding, setResponding] = useState(false);
  const [customResponse, setCustomResponse] = useState("");
  const [responseSent, setResponseSent] = useState(false);
  const [isLiveModalOpen, setIsLiveModalOpen] = useState(false); // New State

  // View Mode: 'camera' | 'photo'. Default depends on config.
  // If we have cameraUrl AND visitorPhoto, default to photo (to see who ringed), but allow toggle.
  // If only cameraUrl, default camera.
  // If only photo, default photo.
  const [viewMode, setViewMode] = useState<"camera" | "photo">(
    initialLog?.visitorPhotoUrl ? "photo" : "camera",
  );

  // Auto-switch view on new ring
  useEffect(() => {
    if (activeRing?.visitorPhotoUrl) {
      setViewMode("photo");
    } else if (effectiveCameraUrl) {
      setViewMode("camera");
    }
  }, [activeRing, effectiveCameraUrl]);

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

  const handleSendResponse = async (msg: string) => {
    if (!activeRing) return;
    setResponding(true);
    try {
      const res = await sendResponse(activeRing.id, msg);
      if (res.success) {
        toast.success("Mensaje enviado");
        setResponseSent(true);
        setCustomResponse("");
      } else {
        toast.error("Error al enviar mensaje");
      }
    } catch {
      toast.error("Error de conexión");
    } finally {
      setResponding(false);
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
          <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-black shadow-inner border border-border-subtle dark:border-white/10 group">
            {viewMode === "camera" && effectiveCameraUrl ? (
              /* Fixed Camera Feed (Legacy/Railway) */
              <CameraFeed url={effectiveCameraUrl} className="w-full h-full" />
            ) : viewMode === "photo" && activeRing?.visitorPhotoUrl ? (
              /* Visitor Photo (Snapshot) */
              <img
                src={activeRing.visitorPhotoUrl}
                className="w-full h-full object-cover"
                alt="Visitor"
              />
            ) : (
              /* Placeholder / Logic while ringing if no photo */
              <div className="w-full h-full bg-zinc-900 flex items-center justify-center">
                <div className="w-16 h-16 rounded-full bg-zinc-800 animate-pulse flex items-center justify-center">
                  <Camera className="text-zinc-500 w-8 h-8" />
                </div>
              </div>
            )}
            {/* Toggle Button for Hybrid (PH) Scenarios - NOW OPENS LIVE MODAL */}
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
            {/* Visual Softening Overlay */}
            <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-80" />
            {/* Visitor Message Overlay */}
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
