interface CameraFeedProps {
  url?: string | null;
  className?: string;
  refreshInterval?: number;
}

export function CameraFeed({ url, className = "" }: CameraFeedProps) {
  // Helper to extract YouTube ID
  const getYouTubeId = (url: string) => {
    const regExp =
      /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=|live\/)([^#&?]*).*/;
    const match = url.match(regExp);
    return match && match[2].length === 11 ? match[2] : null;
  };

  const youtubeId = url ? getYouTubeId(url) : null;

  return (
    <div
      className={`relative bg-black rounded-xl overflow-hidden ${className}`}
    >
      {youtubeId ? (
        <iframe
          width="100%"
          height="100%"
          src={`https://www.youtube.com/embed/${youtubeId}?autoplay=1&mute=1&controls=0&modestbranding=1&playsinline=1&rel=0`}
          title="Live Camera Feed"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          className="w-full h-full object-cover pointer-events-none"
        />
      ) : url ? (
        <img src={url} alt="Live Feed" className="w-full h-full object-cover" />
      ) : (
        <div className="w-full h-full bg-zinc-950 flex flex-col items-center justify-center text-zinc-500">
          <span className="text-xs uppercase tracking-widest mb-2 font-medium">
            Cámara no disponible
          </span>
        </div>
      )}

      {/* Status Overlay */}
      <div className="absolute top-2 right-2 flex items-center gap-2 pointer-events-none z-10">
        <div className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider backdrop-blur-md bg-green-500/20 text-green-500 border border-green-500/30">
          LIVE
        </div>
      </div>
    </div>
  );
}
