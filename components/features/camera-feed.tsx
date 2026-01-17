import { useEffect, useRef, useState } from "react";
import Script from "next/script";

interface CameraFeedProps {
  url?: string | null; // Aquí esperamos la URL WSS de Railway, NO la RTSP
  className?: string;
}

declare global {
  interface Window {
    JSMpeg: any; // eslint-disable-line @typescript-eslint/no-explicit-any
  }
}

export function CameraFeed({ url, className = "" }: CameraFeedProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const playerRef = useRef<any>(null);
  const [isScriptLoaded, setIsScriptLoaded] = useState(false);
  const [error, setError] = useState(false);

  // Detectar si es una URL de WebSocket (Railway)
  const isWs = url?.startsWith("ws://") || url?.startsWith("wss://");

  useEffect(() => {
    // Limpieza al desmontar o cambiar URL
    return () => {
      if (playerRef.current) {
        try {
          playerRef.current.destroy();
        } catch (e) {
          console.error("Error destroying player", e);
        }
        playerRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!isWs || !url || !isScriptLoaded || !canvasRef.current) return;

    // Pequeño delay para asegurar que el canvas esté listo
    const timer = setTimeout(() => {
      if (playerRef.current) {
        playerRef.current.destroy();
      }

      try {
        console.log("🎥 [CameraFeed] Initializing JSMpeg Player");
        console.log("🎥 [CameraFeed] URL:", url);
        console.log("🎥 [CameraFeed] Canvas:", canvasRef.current);

        playerRef.current = new window.JSMpeg.Player(url, {
          canvas: canvasRef.current,
          autoplay: true,
          audio: false,
          loop: true,
          onStalled: () =>
            console.warn(
              "⚠️ [CameraFeed] Stream stalled (low data/connection issue)",
            ),
          onSourceEstablished: () => {
            console.log("✅ [CameraFeed] Connection established to Server");
            setError(false);
          },
          onVideoDecode: () => {
            // Log only first frame to avoid spam
            if (!playerRef.current?.hasDecodedFirstFrame) {
              console.log(
                "🎬 [CameraFeed] First Frame Decoded (Video Playing)",
              );
              playerRef.current.hasDecodedFirstFrame = true;
            }
          },
        });
      } catch (e) {
        console.error("❌ [CameraFeed] Fatal Error init JSMpeg:", e);
        setError(true);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [url, isWs, isScriptLoaded]);

  return (
    <div
      className={`relative bg-zinc-900 rounded-xl overflow-hidden shadow-inner ${className}`}
    >
      {/* Script necesario para decodificar MPEG1 en canvas */}
      <Script
        src="https://cdn.jsdelivr.net/gh/phoboslab/jsmpeg@master/jsmpeg.min.js"
        strategy="afterInteractive"
        onLoad={() => setIsScriptLoaded(true)}
      />

      {isWs ? (
        <>
          <canvas
            ref={canvasRef}
            className="w-full h-full object-cover block"
          />
          {error && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/80 text-white text-xs">
              Error de Conexión
            </div>
          )}
        </>
      ) : (
        /* Fallback para imagen estática o placeholder */
        <div className="w-full h-full flex items-center justify-center text-zinc-500">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {url ? (
            <img
              src={url}
              alt="Camera feed"
              className="w-full h-full object-cover"
            />
          ) : (
            "Cámara Offline"
          )}
        </div>
      )}

      {/* Indicador LIVE estilo Apple/Vercel */}
      {isWs && (
        <div className="absolute top-3 right-3 flex items-center gap-2 pointer-events-none z-10">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
          </span>
          <span className="text-[10px] font-bold text-white/90 tracking-wider shadow-sm">
            LIVE
          </span>
        </div>
      )}
    </div>
  );
}
