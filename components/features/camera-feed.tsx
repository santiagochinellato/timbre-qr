"use client";

import { useEffect, useState } from "react";

interface CameraFeedProps {
  url?: string | null;
  className?: string;
}

export function CameraFeed({ url, className = "" }: CameraFeedProps) {
  const [videoSrc, setVideoSrc] = useState("");

  useEffect(() => {
    // If a URL is passed via props, use it. Otherwise fall back to env var or hardcoded fallback.
    // Note: The 'url' prop originally came from NEXT_PUBLIC_STREAM_URL or similar.
    let baseUrl =
      url ||
      process.env.NEXT_PUBLIC_WS_URL ||
      "wss://video-service-production-44b4.up.railway.app";

    // Normalize URL: Replace wss:// or ws:// with https:// or http://
    if (baseUrl.startsWith("wss://")) {
      baseUrl = baseUrl.replace("wss://", "https://");
    } else if (baseUrl.startsWith("ws://")) {
      baseUrl = baseUrl.replace("ws://", "http://");
    }

    if (baseUrl.endsWith("/")) {
      baseUrl = baseUrl.slice(0, -1);
    }

    if (!baseUrl) {
      setVideoSrc("");
      return;
    }

    // Go2RTC URL
    setVideoSrc(`${baseUrl}/webrtc.html?src=doorbell&media=video`);
  }, [url]);

  const isWs = !!videoSrc;

  return (
    <div
      className={`relative bg-zinc-900 rounded-xl overflow-hidden shadow-inner ${className}`}
    >
      {isWs ? (
        <iframe
          src={videoSrc}
          className="w-full h-full object-cover border-none block"
          allow="autoplay; fullscreen"
          scrolling="no"
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center text-zinc-500">
          Cámara Offline
        </div>
      )}

      {/* LIVE Indicator */}
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
