import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in zoom-in duration-500">
      {/* Header Skeleton */}
      <div className="flex justify-between items-end">
        <div>
          <Skeleton className="h-4 w-32 mb-2 bg-zinc-800" />
          <Skeleton className="h-8 w-48 bg-zinc-800" />
        </div>
        <Skeleton className="h-8 w-24 rounded-full bg-zinc-800" />
      </div>

      {/* Building Cards Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[...Array(2)].map((_, i) => (
          <div
            key={i}
            className="col-span-1 rounded-3xl border border-white/10 bg-zinc-900/50 h-64 p-6 flex flex-col justify-between"
          >
            <div className="flex justify-between items-start">
              <Skeleton className="h-8 w-32 rounded-full bg-zinc-800" />
              <Skeleton className="h-8 w-8 rounded-full bg-zinc-800" />
            </div>
            <div>
              <Skeleton className="h-4 w-24 mb-2 bg-zinc-800" />
              <Skeleton className="h-6 w-40 mb-1 bg-zinc-800" />
              <Skeleton className="h-4 w-32 bg-zinc-800" />
            </div>
          </div>
        ))}
      </div>

      {/* Secondary Status / Activity Skeleton */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="col-span-2 md:col-span-4 rounded-3xl bg-zinc-900/40 border border-white/5 p-6 space-y-6">
          <div className="flex items-center gap-3">
            <Skeleton className="w-10 h-10 rounded-xl bg-zinc-800" />
            <Skeleton className="h-6 w-48 bg-zinc-800" />
          </div>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="flex items-center gap-4 p-4 rounded-2xl bg-white/5 border border-white/5"
              >
                <Skeleton className="w-14 h-14 rounded-xl bg-zinc-800" />
                <div className="flex-1 space-y-2">
                  <div className="flex justify-between">
                    <Skeleton className="h-4 w-32 bg-zinc-800" />
                    <Skeleton className="h-3 w-16 bg-zinc-800" />
                  </div>
                  <Skeleton className="h-3 w-48 bg-zinc-800" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
