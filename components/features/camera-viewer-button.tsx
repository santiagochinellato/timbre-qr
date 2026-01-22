"use client";

import { useState } from "react";
import { Camera, X, TriangleAlert } from "lucide-react";
import { createPortal } from "react-dom";
import dynamic from "next/dynamic";
const LiveVideoPlayer = dynamic(
  () => import("./live-video-player").then((mod) => mod.LiveVideoPlayer),
  {
    ssr: false,
    loading: () => <div className="w-full h-full bg-black animate-pulse" />,
  },
);

export function CameraViewerButton() {
  const [isOpen, setIsOpen] = useState(false);
  const [emergencyConfirm, setEmergencyConfirm] = useState(false);

  const handleCapture = () => {
    // Legacy snapshot capture
    // Note: This grabs a frame from the API (port 8080), not the websocket canvas directly
    // This is safer for cross-browser compat if we want a high-quality JPEG
    const link = document.createElement("a");
    link.href = `/api/camera/snapshot?t=${Date.now()}&download=true`;
    link.download = `captura-${new Date().toISOString()}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleEmergency = () => {
    if (!emergencyConfirm) {
      setEmergencyConfirm(true);
      setTimeout(() => setEmergencyConfirm(false), 3000); // Reset after 3s
      return;
    }

    // Trigger Emergency Action
    alert("¡ALERTA DE EMERGENCIA ENVIADA!");
    setEmergencyConfirm(false);
    setIsOpen(false);
  };

  return (
    <>
      <button
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setIsOpen(true);
        }}
        className="flex items-center gap-2 px-3 py-1.5 bg-cyan-900/40 hover:bg-cyan-900/60 border border-cyan-500/30 rounded-full text-cyan-400 text-[10px] font-bold uppercase tracking-wider transition-all"
      >
        <span>Ver Cámara</span>
        <Camera className="w-3.5 h-3.5" />
      </button>

      {isOpen &&
        createPortal(
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
          >
            <div className="relative w-full max-w-lg bg-zinc-900 border border-white/10 rounded-3xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-white/5 bg-zinc-900/50">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                  <h3 className="font-bold text-white">Cámara en Vivo</h3>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-2 hover:bg-white/10 rounded-full transition-colors text-zinc-400 hover:text-white"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Feed - NOW USING LIVE VIDEO PLAYER */}
              <div className="aspect-video bg-black relative flex-shrink-0">
                <LiveVideoPlayer className="w-full h-full" />
              </div>

              {/* Action Buttons */}
              <div className="p-6 bg-zinc-900 flex flex-col gap-3">
                <button
                  onClick={handleCapture}
                  className="w-full bg-white text-black font-bold py-4 rounded-xl flex items-center justify-center gap-2 hover:bg-zinc-200 transition-colors active:scale-95"
                >
                  <Camera className="w-5 h-5" />
                  Tomar Captura
                </button>

                <button
                  onClick={handleEmergency}
                  className={`w-full font-bold py-4 rounded-xl flex items-center justify-center gap-2 transition-all active:scale-95 duration-200 ${
                    emergencyConfirm
                      ? "bg-red-600 text-white animate-pulse shadow-[0_0_20px_rgba(220,38,38,0.5)]"
                      : "bg-red-500/10 text-red-500 border border-red-500/20 hover:bg-red-500/20"
                  }`}
                >
                  {emergencyConfirm ? (
                    <>
                      <span className="uppercase tracking-widest">
                        ¿CONFIRMAR?
                      </span>
                    </>
                  ) : (
                    <>
                      <TriangleAlert className="w-5 h-5" />
                      EMERGENCIA
                    </>
                  )}
                </button>

                {emergencyConfirm && (
                  <p className="text-center text-xs text-red-400 animate-in fade-in">
                    Presiona de nuevo para enviar alerta inmediata.
                  </p>
                )}
              </div>
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}
