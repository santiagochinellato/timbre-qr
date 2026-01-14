import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="max-w-md mx-auto space-y-6">
      {/* Header Skeleton */}
      <div className="flex items-center gap-4 mb-6">
        <Skeleton className="w-10 h-10 rounded-full bg-zinc-800" />
        <div className="space-y-2">
          <Skeleton className="h-6 w-48 bg-zinc-800" />
          <Skeleton className="h-4 w-24 bg-zinc-800" />
        </div>
      </div>

      {/* Main Card Skeleton */}
      <div className="relative bg-zinc-900 border border-white/5 rounded-2xl overflow-hidden shadow-xl aspect-square md:aspect-video flex flex-col items-center justify-center space-y-4 p-8">
        <Skeleton className="w-24 h-24 rounded-full bg-zinc-800" />
        <div className="space-y-2 text-center w-full flex flex-col items-center">
          <Skeleton className="h-6 w-32 bg-zinc-800" />
          <Skeleton className="h-4 w-40 bg-zinc-800" />
        </div>
      </div>

      {/* Recent Activity Skeleton */}
      <div className="space-y-4">
        <Skeleton className="h-4 w-32 bg-zinc-800" />
        <div className="grid grid-cols-5 gap-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex flex-col items-center gap-2">
              <Skeleton className="w-14 h-14 rounded-2xl bg-zinc-800" />
              <Skeleton className="h-3 w-10 bg-zinc-800" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
