"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { AlertCircle, RefreshCw, Radio } from "lucide-react";

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

  // State Machine: init -> connecting -> playing -> stalled -> non-recoverable error
  const [status, setStatus] = useState<
    "connecting" | "playing" | "stalled" | "offline"
  >("connecting");
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  // Watchdog refs
  const lastTimeRef = useRef<number>(Date.now());
  const watchdogTimerRef = useRef<NodeJS.Timeout | null>(null);

  const initPlayer = useCallback(() => {
    if (!canvasRef.current) return;

    setStatus("connecting");
    setError(null);

    const JSMpeg = (window as any).JSMpeg;
    if (!JSMpeg) {
      setTimeout(initPlayer, 500);
      return;
    }

    try {
      if (playerRef.current) {
        try {
          playerRef.current.destroy();
        } catch (e) {}
      }

      console.log(`🎥 Init JSMpeg: ${streamUrl} (Attempt ${retryCount + 1})`);

      lastTimeRef.current = Date.now(); // Reset watchdog timer on new connection

      playerRef.current = new JSMpeg.Player(streamUrl, {
        canvas: canvasRef.current,
        autoplay: true,
        audio: false,
        disableGl: false,
        videoBufferSize: 2 * 1024 * 1024, // 2MB to resist jitter
        onVideoDecode: () => {
          if (status !== "playing") {
            console.log("✅ Video Playing");
            setStatus("playing");
            if (onStreamStart) onStreamStart();
          }
          // Update activity timestamp for watchdog
          lastTimeRef.current = Date.now();
        },
        onSourceEstablished: () => {
          console.log("📡 Source Connected");
        },
        onSourceCompleted: () => {
          console.warn("⚠️ Source Completed (Server closed connection)");
          handleReconnect();
        },
        onStalled: () => {
          console.warn("⚠️ Internal Stall Warning");
          // JSMpeg's built-in stall detection is sometimes flaky.
          // We rely more on our custom Watchdog, but this is a good hint.
          if (status === "playing") setStatus("stalled");
        },
      });

      startWatchdog();
    } catch (err) {
      console.error("❌ Init Error:", err);
      setError("Error de inicialización");
      setStatus("offline");
    }
  }, [streamUrl, retryCount, status, onStreamStart]);

  const startWatchdog = () => {
    if (watchdogTimerRef.current) clearInterval(watchdogTimerRef.current);

    watchdogTimerRef.current = setInterval(() => {
      if (!playerRef.current) return;

      // Check if we have verified playback recently (last 3 seconds)
      const now = Date.now();
      const timeSinceLastFrame = now - lastTimeRef.current;

      // If playing but no new frames for >3s, trigger stall/reconnect
      if (playerRef.current.isPlaying && timeSinceLastFrame > 3000) {
        console.warn(
          `🐕 Watchdog: No frames for ${timeSinceLastFrame}ms. Reconnecting...`,
        );
        setStatus("stalled");
        handleReconnect();
      }
    }, 1000);
  };

  const handleReconnect = useCallback(() => {
    if (watchdogTimerRef.current) clearInterval(watchdogTimerRef.current);
    if (playerRef.current) {
      try {
        playerRef.current.destroy();
      } catch (e) {}
      playerRef.current = null;
    }

    // Smooth reconnect delay
    setTimeout(() => {
      setRetryCount((prev) => prev + 1);
    }, 2000);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (watchdogTimerRef.current) clearInterval(watchdogTimerRef.current);
      if (playerRef.current) {
        playerRef.current.destroy();
      }
    };
  }, []);

  // Trigger init on retry logic
  useEffect(() => {
    initPlayer();
  }, [retryCount, initPlayer]);

  // Load Script
  useEffect(() => {
    const scriptUrl =
      "https://cdn.jsdelivr.net/gh/phoboslab/jsmpeg@master/jsmpeg.min.js";
    if (!document.querySelector(`script[src="${scriptUrl}"]`)) {
      const script = document.createElement("script");
      script.src = scriptUrl;
      script.async = true;
      document.body.appendChild(script);
      script.onload = () => {
        if (!playerRef.current) initPlayer();
      };
    }
  }, [initPlayer]);

  return (
    <div
      ref={wrapperRef}
      className={`relative bg-black flex items-center justify-center overflow-hidden aspect-video rounded-lg shadow-2xl ${className}`}
    >
      <canvas ref={canvasRef} className="w-full h-full block object-contain" />

      {/* LIVE Badge */}
      {status === "playing" && (
        <div className="absolute top-3 right-3 flex items-center gap-2 pointer-events-none z-10 bg-black/40 px-2 py-1 rounded backdrop-blur-md">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
          </span>
          <span className="text-[10px] font-bold text-white/90 tracking-wider">
            LIVE
          </span>
        </div>
      )}

      {/* States Overlay */}
      {status !== "playing" && !error && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 z-10 bg-black/60 backdrop-blur-sm text-white/90 transition-all duration-300">
          <div className="relative">
            <div className="w-10 h-10 border-2 border-white/20 border-t-red-500 rounded-full animate-spin" />
          </div>
          <p className="text-xs font-bold uppercase tracking-widest text-white/70">
            {status === "stalled" ? "Reconectando..." : "Conectando..."}
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
            className="mt-2 px-4 py-1 bg-red-500/10 hover:bg-red-500/20 rounded text-xs border border-red-500/50 flex items-center gap-2"
          >
            <RefreshCw className="w-3 h-3" /> Reintentar
          </button>
        </div>
      )}
    </div>
  );
}
