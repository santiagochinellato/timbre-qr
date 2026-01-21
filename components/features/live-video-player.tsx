"use client";

interface LiveVideoPlayerProps {
  streamUrl?: string; // Optional: provided by parent or read from env
  className?: string;
}

export function LiveVideoPlayer({
  streamUrl,
  className = "",
}: LiveVideoPlayerProps) {
  // 1. Determine the base URL: Prop > Env Var > Default Empty
  // We use the prop 'streamUrl' if passed (from CameraViewerButton), otherwise env var.
  const rawUrl = streamUrl || process.env.NEXT_PUBLIC_CAMERA_WS_URL || "";

  // 2. Normalize: Go2RTC uses HTTPS for WebRTC, so we replace wss/ws with https/http
  const finalUrl = rawUrl
    .replace("wss://", "https://")
    .replace("ws://", "http://");

  // 3. Construct specific Go2RTC player URL
  const videoSrc = finalUrl
    ? `${finalUrl}/webrtc.html?src=doorbell&media=video`
    : "";

  if (!videoSrc) {
    return (
      <div
        className={`w-full aspect-video bg-black rounded-lg flex items-center justify-center text-white/50 ${className}`}
      >
        <p>Offline</p>
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
