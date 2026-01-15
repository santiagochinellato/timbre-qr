export function CameraFeed({
  className = "",
}: {
  refreshInterval?: number; // Kept for interface compatibility but unused
  className?: string;
}) {
  return (
    <div
      className={`relative bg-black rounded-xl overflow-hidden ${className}`}
    >
      <iframe
        width="100%"
        height="100%"
        src="https://www.youtube.com/embed/6-cDe1uUTqc?autoplay=1&mute=1&controls=0&playsinline=1&rel=0"
        title="Live Camera Feed"
        frameBorder="0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowFullScreen
        className="w-full h-full object-cover"
      />

      {/* Status Overlay */}
      <div className="absolute top-2 right-2 flex items-center gap-2 pointer-events-none">
        <div className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider backdrop-blur-md bg-green-500/20 text-green-500 border border-green-500/30">
          LIVE
        </div>
      </div>
    </div>
  );
}
