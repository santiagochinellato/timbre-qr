"use client";

import { X, Video, AlertCircle } from "lucide-react";

interface LiveCameraModalProps {
  isOpen: boolean;
  onClose: () => void;
  // streamUrl ya no es obligatorio porque lo leemos de la variable de entorno global
  streamUrl?: string;
}

export function LiveCameraModal({ isOpen, onClose }: LiveCameraModalProps) {
  if (!isOpen) return null;

  // 1. Obtener y limpiar la URL base (Igual que en LiveVideoPlayer)
  const rawStreamUrl =
    process.env.NEXT_PUBLIC_WS_URL ||
    "wss://video-service-production-44b4.up.railway.app";
  // Convertimos wss:// o ws:// a https:// o http:// para el iframe
  const streamBaseUrl = rawStreamUrl
    .replace("wss://", "https://")
    .replace("ws://", "http://");

  // 2. Construir la URL del reproductor Go2RTC
  const videoSrc = `${streamBaseUrl}/webrtc.html?src=doorbell&media=video`;
  const hasConfig = !!streamBaseUrl;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop (Fondo oscuro) */}
      <div
        className="absolute inset-0 bg-black/90 backdrop-blur-sm animate-in fade-in duration-300"
        onClick={onClose}
      />

      {/* Modal Content */}
      <div className="relative w-full max-w-4xl bg-zinc-950 border border-zinc-800 rounded-2xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300 ring-1 ring-white/10">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-zinc-800 bg-zinc-900/50">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-red-600/20 flex items-center justify-center border border-red-500/30">
              <Video className="w-4 h-4 text-red-500 animate-pulse" />
            </div>
            <div>
              <h3 className="text-white font-bold text-lg">Cámara en Vivo</h3>
              <p className="text-zinc-400 text-xs flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block" />
                Conexión WebRTC Estable
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-white/10 text-zinc-400 hover:text-white transition-all active:scale-95"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Video Area */}
        <div className="relative aspect-video bg-black flex items-center justify-center group">
          {!hasConfig ? (
            <div className="flex flex-col items-center text-red-400 gap-2 p-6 text-center">
              <AlertCircle className="w-12 h-12 mb-2 opacity-80" />
              <p className="font-semibold">Error de Configuración</p>
              <p className="text-sm text-zinc-500">
                Falta la variable NEXT_PUBLIC_WS_URL en Railway
              </p>
            </div>
          ) : (
            <iframe
              src={videoSrc}
              className="w-full h-full border-none object-cover"
              allow="autoplay; fullscreen; microphone"
              scrolling="no"
            />
          )}

          {/* Live Badge (Overlay) */}
          {hasConfig && (
            <div className="absolute top-4 left-4 flex items-center gap-2 bg-red-600/90 backdrop-blur-md px-3 py-1.5 rounded-md shadow-lg pointer-events-none">
              <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
              <span className="text-xs font-bold text-white tracking-widest uppercase">
                EN VIVO
              </span>
            </div>
          )}
        </div>

        {/* Footer info */}
        <div className="p-4 bg-zinc-900/80 border-t border-zinc-800 flex justify-between items-center text-xs text-zinc-500">
          <p>Stream optimizado por Go2RTC</p>
          <p className="font-mono opacity-50">src: doorbell</p>
        </div>
      </div>
    </div>
  );
}
