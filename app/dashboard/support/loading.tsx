import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Skeleton className="w-12 h-12 rounded-xl bg-zinc-200 dark:bg-zinc-800" />
        <div className="space-y-2">
          <Skeleton className="h-6 w-48 bg-zinc-200 dark:bg-zinc-800" />
          <Skeleton className="h-4 w-96 bg-zinc-200 dark:bg-zinc-800" />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
        {/* Left Column: FAQ & Manual */}
        <div className="lg:col-span-1 space-y-8">
          {/* FAQ Skeleton */}
          <div className="bg-bg-card dark:bg-black/20 border border-border-subtle dark:border-white/5 rounded-2xl p-6 space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-10 w-full rounded-lg bg-zinc-200 dark:bg-zinc-800" />
              </div>
            ))}
          </div>

          {/* Manual Card Skeleton */}
          <div className="bg-bg-card dark:bg-black/20 border border-border-subtle dark:border-white/5 rounded-2xl p-6 space-y-4">
            <div className="flex items-center gap-2">
              <Skeleton className="h-6 w-6 rounded bg-zinc-200 dark:bg-zinc-800" />
              <Skeleton className="h-6 w-32 bg-zinc-200 dark:bg-zinc-800" />
            </div>
            <Skeleton className="h-4 w-full bg-zinc-200 dark:bg-zinc-800" />
            <Skeleton className="h-4 w-2/3 bg-zinc-200 dark:bg-zinc-800" />

            <Skeleton className="h-12 w-full rounded-xl bg-zinc-200 dark:bg-zinc-800 mt-2" />
          </div>
        </div>

        {/* Right Column: Chat */}
        <div className="lg:col-span-2">
          <Skeleton className="w-full h-[600px] rounded-3xl bg-bg-card dark:bg-zinc-900/50 border border-border-subtle dark:border-white/5" />
        </div>
      </div>
    </div>
  );
}
