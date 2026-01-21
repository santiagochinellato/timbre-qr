"use client";

export function LiveVideoPlayer() {
  // We transform wss:// to https:// because Go2RTC serves WebRTC over HTTPS
  const streamUrl =
    process.env.NEXT_PUBLIC_CAMERA_WS_URL?.replace("wss://", "https://") || "";

  // Use the native WebRTC player provided by Go2RTC
  // webrtc.html = zero latency. fallback logic can be added if needed.
  const videoSrc = `${streamUrl}/webrtc.html?src=doorbell&media=video`;

  return (
    <div className="w-full aspect-video bg-black rounded-lg overflow-hidden relative shadow-lg">
      <iframe
        src={videoSrc}
        className="w-full h-full border-none"
        allow="autoplay; fullscreen; microphone" // Microphone added for 2-way audio potential
        scrolling="no"
      />
    </div>
  );
}
