"use client";

import { useEffect, useState } from "react";

interface LiveVideoPlayerProps {
  streamUrl?: string; // Optional because we might read from env if not passed
  className?: string;
}

export function LiveVideoPlayer({ className = "" }: LiveVideoPlayerProps) {
  // URL de tu servicio en Railway (SIN wss://, ahora es https://)
  // Asegúrate de que esta variable en .env sea: https://tu-video-service.up.railway.app
  // If the env var is WSS, we replace it.
  const [videoSrc, setVideoSrc] = useState("");

  useEffect(() => {
    let baseUrl = process.env.NEXT_PUBLIC_CAMERA_WS_URL || "";

    // Normalize URL: Replace wss:// or ws:// with https:// or http://
    if (baseUrl.startsWith("wss://")) {
      baseUrl = baseUrl.replace("wss://", "https://");
    } else if (baseUrl.startsWith("ws://")) {
      baseUrl = baseUrl.replace("ws://", "http://");
    }

    // Remove trailing slash if present
    if (baseUrl.endsWith("/")) {
      baseUrl = baseUrl.slice(0, -1);
    }

    // Fallback if empty
    if (!baseUrl) return;

    // Construct Go2RTC embedding URL
    // webrtc.html = zero latency
    // If it fails on some networks, we can fallback to mse.html
    setVideoSrc(`${baseUrl}/webrtc.html?src=doorbell&media=video`);
  }, []);

  if (!videoSrc) {
    return (
      <div
        className={`w-full aspect-video bg-black rounded-lg flex items-center justify-center text-white/50 ${className}`}
      >
        <p>Cargando stream...</p>
      </div>
    );
  }

  return (
    <div
      className={`w-full aspect-video bg-black rounded-lg overflow-hidden relative shadow-lg ${className}`}
    >
      <iframe
        src={videoSrc}
        className="w-full h-full border-none"
        allow="autoplay; fullscreen; microphone"
        scrolling="no"
      />
    </div>
  );
}
