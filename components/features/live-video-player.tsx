"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { AlertCircle, RefreshCw } from "lucide-react";

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
  const playerRef = useRef<any>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [isStalled, setIsStalled] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  const initPlayer = useCallback(() => {
    if (!canvasRef.current) return;

    setIsLoading(true);
    setIsStalled(false);
    setError(null);

    // Dynamic import handling logic would go here in a real separate utility,
    // but here we rely on the script tag approach or window global.
    const JSMpeg = (window as any).JSMpeg;
    if (!JSMpeg) {
      console.error("JSMpeg not loaded yet");
      // Retry shortly if script isn't ready
      setTimeout(initPlayer, 500);
      return;
    }

    try {
      if (playerRef.current) {
        playerRef.current.destroy();
      }

      console.log(
        `🎥 Connecting to stream: ${streamUrl} (Attempt ${retryCount + 1})`,
      );

      playerRef.current = new JSMpeg.Player(streamUrl, {
        canvas: canvasRef.current,
        autoplay: true,
        audio: false, // Explicitly disable audio processing on client
        disableGl: false,
        videoBufferSize: 2 * 1024 * 1024, // 2MB Buffer for robustness
        onVideoDecode: () => {
          if (isLoading) {
            console.log("✅ Video Playing");
            setIsLoading(false);
            setIsStalled(false);
            setRetryCount(0); // Reset retries on success
            if (onStreamStart) onStreamStart();
          }
        },
        onSourceEstablished: () => {
          console.log("📡 Source Established");
        },
        onStalled: () => {
          console.warn("⚠️ Stream Stalled - Triggering Reconnect");
          if (!isStalled) {
            setIsStalled(true);
            handleReconnect(); // Auto-reconnect
          }
        },
      });
    } catch (err) {
      console.error("❌ Player Init Error:", err);
      setError("Error inicializando reproductor");
      setIsLoading(false);
    }
  }, [streamUrl, retryCount, isStalled, onStreamStart]);

  const handleReconnect = useCallback(() => {
    // Destroy current instance
    if (playerRef.current) {
      try {
        playerRef.current.destroy();
      } catch (e) {
        console.error(e);
      }
      playerRef.current = null;
    }

    // Wait 2s and retry
    const timeout = setTimeout(() => {
      setRetryCount((prev) => prev + 1);
    }, 2000); // 2 second cool-down before reconnect

    return () => clearTimeout(timeout);
  }, []);

  // Effect to trigger init on retryCount change
  useEffect(() => {
    initPlayer();

    return () => {
      if (playerRef.current) {
        playerRef.current.destroy();
        playerRef.current = null;
      }
    };
  }, [retryCount, initPlayer]);

  // Load Script once
  useEffect(() => {
    const scriptUrl =
      "https://cdn.jsdelivr.net/gh/phoboslab/jsmpeg@master/jsmpeg.min.js";
    let script = document.querySelector(
      `script[src="${scriptUrl}"]`,
    ) as HTMLScriptElement;

    if (!script) {
      script = document.createElement("script");
      script.src = scriptUrl;
      script.async = true;
      document.body.appendChild(script);
    }

    const onScriptLoad = () => {
      // Trigger init if not already started
      if (!playerRef.current) {
        initPlayer();
      }
    };

    script.addEventListener("load", onScriptLoad);

    return () => {
      script.removeEventListener("load", onScriptLoad);
    };
  }, [initPlayer]);

  return (
    <div
      ref={wrapperRef}
      className={`relative bg-black flex items-center justify-center overflow-hidden aspect-video ${className}`}
    >
      <canvas ref={canvasRef} className="w-full h-full block object-contain" />

      {/* Loading / Stall Overlay */}
      {(isLoading || isStalled) && !error && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 z-10 bg-black/50 backdrop-blur-sm text-white/90">
          <div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin" />
          <p className="text-xs font-medium uppercase tracking-wider">
            {isStalled ? "Reconectando..." : "Cargando..."}
          </p>
        </div>
      )}

      {/* Error Overlay */}
      {error && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 z-20 text-red-500 bg-black/90 p-4 text-center">
          <AlertCircle className="w-8 h-8 opacity-80" />
          <p className="text-sm font-bold">{error}</p>
          <button
            onClick={() => setRetryCount((c) => c + 1)}
            className="mt-2 px-4 py-1 bg-red-500/10 hover:bg-red-500/20 rounded text-xs border border-red-500/50 flex items-center gap-2 transition-colors"
          >
            <RefreshCw className="w-3 h-3" /> Reintentar
          </button>
        </div>
      )}
    </div>
  );
}
