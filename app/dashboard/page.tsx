import { auth } from "@/lib/auth";
import { db } from "@/db";
import { userUnits } from "@/db/schema";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { BuildingGrid } from "@/components/dashboard/building-grid";
import { ActivityFeed } from "@/components/dashboard/activity-feed";
import { Skeleton } from "@/components/ui/skeleton";

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const userId = session.user.id;

  // Optimization: Fetch unit IDs quickly to pass to Activity Feed
  // This avoids double grouping logic inside activity feed if we just pass IDs.
  const myUnits = await db
    .select({ unitId: userUnits.unitId })
    .from(userUnits)
    .where(eq(userUnits.userId, userId));

  const unitIds = myUnits.map((u) => u.unitId);

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in zoom-in duration-500">
      {/* Header */}
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-text-muted text-sm font-medium uppercase tracking-wider">
            Centro de Comando
          </h2>
          <h1 className="text-3xl font-bold text-text-main tracking-tight">
            Hola, {session.user.name?.split(" ")[0]}
          </h1>
        </div>
        <div className="flex gap-2">
          <div className="bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-full flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-emerald-500 text-xs font-bold uppercase tracking-wider">
              Online
            </span>
          </div>
        </div>
      </div>

      <Suspense fallback={<Skeleton className="h-64 w-full rounded-3xl" />}>
        <BuildingGrid userId={userId} />
      </Suspense>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Suspense
          fallback={
            <Skeleton className="col-span-2 md:col-span-4 h-96 w-full rounded-3xl" />
          }
        >
          <ActivityFeed unitIds={unitIds} />
        </Suspense>
      </div>
    </div>
  );
}
