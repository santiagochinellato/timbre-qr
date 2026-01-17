"use client";

import { useEffect, useRef, useState } from "react";
import { AlertCircle } from "lucide-react";

interface LiveVideoPlayerProps {
  streamUrl: string;
  className?: string;
  onStreamStart?: () => void;
  onError?: (msg: string) => void;
}

export function LiveVideoPlayer({
  streamUrl,
  className = "",
  onStreamStart,
  onError,
}: LiveVideoPlayerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setIsLoading(true);
    setError(null);

    // Timeout to prevent infinite spinner
    const loadTimeout = setTimeout(() => {
      if (isLoading) {
        setError("Tiempo de espera agotado. Verifique conexión.");
        setIsLoading(false);
      }
    }, 15000); // 15s timeout

    // Load JSMPEG library dynamically
    const script = document.createElement("script");
    script.src =
      "https://cdn.jsdelivr.net/gh/phoboslab/jsmpeg@master/jsmpeg.min.js";
    script.async = true;
    document.body.appendChild(script);

    let player: any = null;

    script.onload = () => {
      try {
        if (!canvasRef.current) return;

        const JSMpeg = (window as any).JSMpeg;
        if (!JSMpeg) {
          throw new Error("JSMpeg lib not found");
        }

        player = new JSMpeg.Player(streamUrl, {
          canvas: canvasRef.current,
          autoplay: true,
          audio: false,
          disableGl: false, // Try WebGL for performance
          onVideoDecode: () => {
            // First frame decoded!
            clearTimeout(loadTimeout);
            setIsLoading(false);
            if (onStreamStart) onStreamStart();
          },
          onSourceEstablished: () => {
            // Connection made but no video yet
            console.log("JSMPEG Source Established");
          },
          onStalled: () => {
            // Stream stopped receiving data
            console.warn("JSMPEG Stall");
            //  setError("Señal inestable"); // Optional: showing error or keeping last frame
          },
        });
      } catch (err) {
        console.error("JSMpeg init error:", err);
        clearTimeout(loadTimeout);
        setError("Error al iniciar reproductor");
        setIsLoading(false);
        if (onError) onError("Init Failed");
      }
    };

    script.onerror = () => {
      clearTimeout(loadTimeout);
      setError("Error cargando librería de video");
      setIsLoading(false);
      if (onError) onError("Lib Load Failed");
    };

    return () => {
      clearTimeout(loadTimeout);
      if (player) {
        try {
          player.destroy();
        } catch (e) {
          console.error(e);
        }
      }
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
    };
  }, [streamUrl]);

  return (
    <div
      className={`relative bg-black flex items-center justify-center overflow-hidden ${className}`}
    >
      <canvas ref={canvasRef} className="w-full h-full block object-contain" />

      {/* States */}
      {isLoading && !error && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 z-10 text-white/80">
          <div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin" />
          <p className="text-xs font-medium uppercase tracking-wider">
            Conectando...
          </p>
        </div>
      )}

      {error && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 z-20 text-red-500 bg-black/80 p-4 text-center">
          <AlertCircle className="w-8 h-8 opacity-80" />
          <p className="text-sm font-bold">{error}</p>
        </div>
      )}
    </div>
  );
}
