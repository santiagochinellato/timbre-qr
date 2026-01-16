"use client";

import { useEffect, useRef, useState } from "react";
import { X, Video, AlertCircle } from "lucide-react";

interface LiveCameraModalProps {
  isOpen: boolean;
  onClose: () => void;
  streamUrl?: string; // Default: ws://localhost:9999
}

export function LiveCameraModal({
  isOpen,
  onClose,
  streamUrl = "ws://localhost:9999",
}: LiveCameraModalProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    setIsLoading(true);
    setError(null);

    // Load JSMPEG library dynamically from CDN
    const script = document.createElement("script");
    script.src = "https://jsmpeg.com/jsmpeg.min.js";
    script.async = true;
    document.body.appendChild(script);

    let player: any = null;

    script.onload = () => {
      try {
        if (!canvasRef.current) return;

        // JSMpeg is attached to window
        const JSMpeg = (window as any).JSMpeg;

        if (!JSMpeg) {
          setError("Failed to load video player library");
          setIsLoading(false);
          return;
        }

        player = new JSMpeg.Player(streamUrl, {
          canvas: canvasRef.current,
          autoplay: true,
          audio: false,
          onVideoDecode: () => {
            // Remove loading state once first frame is decoded
            setIsLoading(false);
          },
        });
      } catch (err) {
        console.error("JSMpeg init error:", err);
        setError("Error initializing video stream");
        setIsLoading(false);
      }
    };

    script.onerror = () => {
      setError("Failed to load video capabilities");
      setIsLoading(false);
    };

    return () => {
      if (player) {
        try {
          player.destroy();
        } catch (e) {
          console.error("Error destroying player:", e);
        }
      }
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
    };
  }, [isOpen, streamUrl]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300"
        onClick={onClose}
      />

      {/* Modal Content */}
      <div className="relative w-full max-w-4xl bg-zinc-950 border border-zinc-800 rounded-2xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-zinc-800 bg-zinc-900/50">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-red-500/20 flex items-center justify-center">
              <Video className="w-4 h-4 text-red-500 animate-pulse" />
            </div>
            <div>
              <h3 className="text-white font-bold">Transmisión en Vivo</h3>
              <p className="text-zinc-400 text-xs">Cámara de Entrada</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-white/10 text-zinc-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Video Area */}
        <div className="relative aspect-video bg-black flex items-center justify-center">
          <canvas
            ref={canvasRef}
            className="w-full h-full block object-contain"
          />

          {/* Loading State */}
          {isLoading && !error && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/50 backdrop-blur-sm z-10 text-white">
              <div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin" />
              <p className="text-sm font-medium">Conectando a la cámara...</p>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/80 z-20 text-red-500">
              <AlertCircle className="w-10 h-10 mb-2" />
              <p className="font-bold">{error}</p>
              <button
                onClick={onClose}
                className="mt-4 px-4 py-2 bg-zinc-800 text-white rounded-lg hover:bg-zinc-700 text-sm"
              >
                Cerrar
              </button>
            </div>
          )}

          {/* Live Badge */}
          {!isLoading && !error && (
            <div className="absolute top-4 right-4 flex items-center gap-2 bg-black/60 backdrop-blur-md px-3 py-1 rounded-full border border-white/10">
              <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              <span className="text-xs font-bold text-white tracking-widest uppercase">
                LIVE
              </span>
            </div>
          )}
        </div>

        {/* Footer info */}
        <div className="p-4 bg-zinc-900/50 border-t border-zinc-800 text-center">
          <p className="text-zinc-500 text-xs">
            Conexión segura vía WebSocket • Stream optimizado para baja latencia
          </p>
        </div>
      </div>
    </div>
  );
}
