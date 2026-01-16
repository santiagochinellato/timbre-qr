"use client";

import { useEffect, useState } from "react";
import { AlertCircle, RefreshCw } from "lucide-react";

interface ServerlessCameraViewProps {
  refreshInterval?: number;
  className?: string; // Add className prop
}

export function ServerlessCameraView({
  refreshInterval = 1000,
  className = "",
}: ServerlessCameraViewProps) {
  const [src, setSrc] = useState<string>("/api/camera/live?t=0");
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      // Timestamp querystring forces the browser to discard cache and fetch new frame
      setSrc(`/api/camera/live?t=${Date.now()}`);
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [refreshInterval]);

  const handleLoad = () => {
    setLoading(false);
    setError(false);
  };

  const handleError = () => {
    setLoading(false);
    setError(true);
  };

  return (
    <div
      className={`relative w-full h-full bg-zinc-950 rounded-xl overflow-hidden shadow-inner flex items-center justify-center border border-zinc-800 ${className}`}
    >
      {/* The Image Stream */}
      {!error && (
        <img
          src={src}
          alt="Live Camera Feed"
          className="w-full h-full object-cover"
          onLoad={handleLoad}
          onError={handleError}
        />
      )}

      {/* Loading Overlay (only initial) */}
      {loading && !error && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-zinc-900/50 backdrop-blur-sm z-10 transition-opacity duration-300">
          <RefreshCw className="w-8 h-8 text-white/50 animate-spin" />
        </div>
      )}

      {/* Error Overlay */}
      {error && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-zinc-900 p-4 text-center z-20">
          <AlertCircle className="w-10 h-10 text-red-500/50 mb-2" />
          <p className="text-zinc-500 text-xs uppercase tracking-wider font-bold">
            Señal Interrumpida
          </p>
          <button
            onClick={() => setError(false)}
            className="mt-4 px-4 py-1.5 bg-zinc-800 text-zinc-300 text-xs rounded-full hover:bg-zinc-700 transition-colors"
          >
            Reintentar
          </button>
        </div>
      )}

      {/* Live Badge */}
      <div className="absolute top-3 right-3 flex items-center gap-1.5 bg-black/60 backdrop-blur-md px-2 py-1 rounded-full border border-white/10 pointer-events-none z-30">
        <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
        <span className="text-[9px] font-bold text-white tracking-widest uppercase">
          LIVE
        </span>
      </div>
    </div>
  );
}
