import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <Skeleton className="h-4 w-24 mb-2 bg-zinc-800" />
          <Skeleton className="h-8 w-48 bg-zinc-800" />
        </div>
      </div>

      <div className="space-y-4">
        {[...Array(8)].map((_, i) => (
          <div
            key={i}
            className="flex items-center gap-4 p-4 rounded-2xl bg-zinc-900/50 border border-white/5"
          >
            <Skeleton className="w-12 h-12 rounded-xl bg-zinc-800 shrink-0" />
            <div className="flex-1 min-w-0 space-y-2">
              <div className="flex justify-between items-center">
                <Skeleton className="h-5 w-32 bg-zinc-800" />
                <Skeleton className="h-3 w-20 bg-zinc-800" />
              </div>
              <Skeleton className="h-4 w-48 bg-zinc-800" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
