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
      <div className="w-full h-full bg-zinc-950 flex flex-col items-center justify-center text-zinc-500">
        <span className="text-xs uppercase tracking-widest mb-2 font-medium">
          Cámara no disponible
        </span>
      </div>

      {/* Status Overlay */}
      <div className="absolute top-2 right-2 flex items-center gap-2 pointer-events-none">
        <div className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider backdrop-blur-md bg-green-500/20 text-green-500 border border-green-500/30">
          LIVE
        </div>
      </div>
    </div>
  );
}
