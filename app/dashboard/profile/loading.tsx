import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="max-w-xl mx-auto space-y-8">
      <div className="text-center space-y-2">
        <Skeleton className="w-24 h-24 rounded-full mx-auto bg-zinc-800" />
        <Skeleton className="h-6 w-32 mx-auto bg-zinc-800" />
        <Skeleton className="h-4 w-48 mx-auto bg-zinc-800" />
      </div>

      <div className="space-y-4 bg-zinc-900/50 p-6 rounded-3xl border border-white/5">
        <div className="space-y-2">
          <Skeleton className="h-4 w-24 bg-zinc-800" />
          <Skeleton className="h-10 w-full rounded-xl bg-zinc-800" />
        </div>
        <div className="space-y-2">
          <Skeleton className="h-4 w-24 bg-zinc-800" />
          <Skeleton className="h-10 w-full rounded-xl bg-zinc-800" />
        </div>
        <div className="space-y-2">
          <Skeleton className="h-4 w-24 bg-zinc-800" />
          <Skeleton className="h-10 w-full rounded-xl bg-zinc-800" />
        </div>

        <Skeleton className="h-12 w-full rounded-xl bg-zinc-800 mt-6" />
      </div>
    </div>
  );
}
