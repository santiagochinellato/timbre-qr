"use client";

import { useState } from "react";
import { AlertCircle } from "lucide-react";

export interface LiveVideoPlayerProps {
  streamUrl?: string;
  className?: string;
}

export function LiveVideoPlayer({
  streamUrl,
  className = "",
}: LiveVideoPlayerProps) {
  // 1. Obtenemos la URL base: Props > Env Var (CAMERA) > Env Var (WS) > Hardcoded Fallback
  const envUrl =
    process.env.NEXT_PUBLIC_CAMERA_WS_URL ||
    process.env.NEXT_PUBLIC_WS_URL ||
    "wss://video-service-production-44b4.up.railway.app";

  // Debug Log (Simplificado)
  if (typeof window !== "undefined" && !envUrl) {
    console.warn("[LiveVideoPlayer] All env vars missing, using empty string.");
  }

  const rawStreamUrl = streamUrl || envUrl;

  const streamBaseUrl = rawStreamUrl
    .replace("wss://", "https://")
    .replace("ws://", "http://");

  // 2. Construimos la URL para el reproductor WebRTC nativo de Go2RTC
  // "webrtc.html" da la latencia más baja (menos de 0.5s)
  // "src=doorbell" debe coincidir con el nombre que pusimos en go2rtc.yaml
  const videoSrc = `${streamBaseUrl}/webrtc.html?src=doorbell&media=video`;

  // Estado simple para manejo de errores de carga (opcional)
  const [hasError, setHasError] = useState(false);

  if (!streamBaseUrl) {
    return (
      <div className="flex flex-col items-center justify-center w-full aspect-video bg-neutral-900 rounded-lg text-neutral-400">
        <AlertCircle className="w-8 h-8 mb-2 opacity-50" />
        <span className="text-xs">Sin URL de video configurada</span>
      </div>
    );
  }

  if (hasError) {
    return (
      <div className="flex flex-col items-center justify-center w-full aspect-video bg-neutral-900 rounded-lg text-neutral-400">
        <AlertCircle className="w-8 h-8 mb-2 text-red-500 opacity-50" />
        <span className="text-xs">No se pudo conectar a la cámara</span>
        <button
          onClick={() => setHasError(false)}
          className="mt-4 px-3 py-1 bg-neutral-800 rounded text-xs hover:bg-neutral-700"
        >
          Reintentar
        </button>
      </div>
    );
  }

  return (
    <div
      className={`w-full aspect-video bg-black rounded-lg overflow-hidden relative shadow-2xl ring-1 ring-white/10 ${className}`}
    >
      {/* IFRAME MÁGICO DE GO2RTC 
        - allow="autoplay; fullscreen; microphone": Permisos necesarios
        - scrolling="no": Evita barras de desplazamiento feas
      */}
      <iframe
        src={videoSrc}
        className="w-full h-full border-none object-cover"
        allow="autoplay; fullscreen; microphone"
        scrolling="no"
        onError={() => setHasError(true)}
      />

      {/* Indicador visual "EN VIVO" opcional */}
      <div className="absolute top-3 left-3 flex items-center gap-2 bg-black/60 backdrop-blur-md px-2 py-1 rounded-full border border-white/5 pointer-events-none">
        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
        <span className="text-[10px] font-medium text-white/90 tracking-wide uppercase">
          En Vivo
        </span>
      </div>
    </div>
  );
}

// Exportamos por defecto también para compatibilidad
export default LiveVideoPlayer;
