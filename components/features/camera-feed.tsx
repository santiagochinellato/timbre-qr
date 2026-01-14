"use client";

import { useEffect, useState } from "react";
import { Loader2, RefreshCw } from "lucide-react";
import Image from "next/image";

export function CameraFeed({
  refreshInterval = 1000,
  className = "",
}: {
  refreshInterval?: number;
  className?: string;
}) {
  const [src, setSrc] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    // Generate new URL to bust cache
    const newSrc = `/api/camera/snapshot?t=${Date.now()}`;
    // Preload image
    const img = new window.Image();
    img.src = newSrc;
    img.onload = () => {
      setSrc(newSrc);
      setLoading(false);
      setError(false);
    };
    img.onerror = () => {
      setLoading(false);
      setError(true);
    };
  }, [tick]);

  useEffect(() => {
    const interval = setInterval(() => {
      setTick((t) => t + 1);
    }, refreshInterval);
    return () => clearInterval(interval);
  }, [refreshInterval]);

  return (
    <div
      className={`relative bg-black rounded-xl overflow-hidden ${className}`}
    >
      {src && !error ? (
        <img src={src} alt="Live Feed" className="w-full h-full object-cover" />
      ) : (
        <div className="w-full h-full flex items-center justify-center bg-zinc-900 text-zinc-500">
          {error ? (
            <div className="flex flex-col items-center gap-2">
              <RefreshCw className="w-8 h-8 opacity-50" />
              <span className="text-xs">Sin señal</span>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <Loader2 className="w-8 h-8 animate-spin opacity-50" />
              <span className="text-xs">Cargando...</span>
            </div>
          )}
        </div>
      )}

      {/* Status Overlay */}
      <div className="absolute top-2 right-2 flex items-center gap-2">
        <div
          className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider backdrop-blur-md ${
            error
              ? "bg-red-500/20 text-red-500 border border-red-500/30"
              : "bg-green-500/20 text-green-500 border border-green-500/30"
          }`}
        >
          {error ? "OFFLINE" : "LIVE"}
        </div>
      </div>
    </div>
  );
}
