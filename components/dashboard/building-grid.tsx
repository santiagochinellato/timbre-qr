import { db } from "@/db";
import { userUnits, units, buildings } from "@/db/schema";
import { eq } from "drizzle-orm";
import Link from "next/link";
import { MapPin } from "lucide-react";
import { CameraViewerButton } from "@/components/features/camera-viewer-button";

export async function BuildingGrid({ userId }: { userId: string }) {
  // 1. Fetch ALL units to group them
  const allUserUnits = await db
    .select({
      unitId: units.id,
      unitLabel: units.label,
      buildingName: buildings.name,
      buildingSlug: buildings.slug,
      cameraUrl: buildings.cameraUrl,
    })
    .from(userUnits)
    .innerJoin(units, eq(userUnits.unitId, units.id))
    .innerJoin(buildings, eq(units.buildingId, buildings.id))
    .where(eq(userUnits.userId, userId));

  if (allUserUnits.length === 0) {
    return (
      <div className="p-8 border border-dashed border-border-subtle rounded-2xl text-center">
        <p className="text-text-muted">No tienes propiedades asignadas.</p>
      </div>
    );
  }

  // Group by Building
  const buildingsMap = new Map();
  allUserUnits.forEach((u) => {
    if (!buildingsMap.has(u.buildingName)) {
      buildingsMap.set(u.buildingName, u);
    }
  });
  const uniqueBuildings = Array.from(buildingsMap.values());

  const unitIds = allUserUnits.map((u) => u.unitId);

  // 2. Check active rings
  const now = new Date();
  const twoMinutesAgo = new Date(now.getTime() - 2 * 60 * 1000);

  const activeRings = await db.query.accessLogs.findMany({
    where: (logs, { and, inArray, eq, gt }) =>
      and(
        inArray(logs.unitId, unitIds),
        eq(logs.status, "ringing"),
        gt(logs.createdAt, twoMinutesAgo),
      ),
    with: {
      unit: true,
    },
    columns: { unitId: true },
  });

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {uniqueBuildings.map((bldg) => {
        const activeRingForBuilding = activeRings.find((r) =>
          allUserUnits.some(
            (u) =>
              u.unitId === r.unitId && u.buildingName === bldg.buildingName,
          ),
        );

        const isBuildingRinging = !!activeRingForBuilding;
        const ringingLabel = activeRingForBuilding?.unit?.label;

        return (
          <Link
            key={bldg.buildingSlug}
            href={`/dashboard/properties/${
              activeRingForBuilding ? activeRingForBuilding.unitId : bldg.unitId
            }`}
            className={`col-span-1 relative group overflow-hidden rounded-3xl border bg-bg-card backdrop-blur-xl transition-all duration-300 h-64 ${
              isBuildingRinging
                ? "border-status-alert/80 shadow-[0_0_50px_rgba(239,68,68,0.4)] animate-pulse"
                : "border-border-subtle hover:border-primary/50 shadow-sm"
            }`}
          >
            <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/90 z-10" />

            <div className="absolute inset-0 z-0 bg-zinc-400 dark:bg-zinc-600">
              {(() => {
                let bgImage =
                  "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=2070&auto=format&fit=crop";
                const name = bldg.buildingName || "";
                if (name.includes("Cauquén") || name.includes("Cauquen"))
                  bgImage = "/edificio1.jpg";
                if (name.includes("Cabañas")) bgImage = "/edificio2.jpg";
                if (name.includes("Victorias")) bgImage = "/phPhoto.jpeg";

                return (
                  <div
                    className="w-full h-full opacity-30 mix-blend-overlay bg-cover bg-center group-hover:scale-105 transition-transform duration-700"
                    style={{ backgroundImage: `url('${bgImage}')` }}
                  />
                );
              })()}
            </div>

            <div className="relative z-20 p-6 h-full flex flex-col justify-between">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-2 bg-black/60 backdrop-blur rounded-full px-3 py-1.5 border border-white/10">
                  <MapPin className="w-3 h-3 text-cyan-400" />
                  <span className="text-xs font-medium text-white max-w-[150px] truncate">
                    {bldg.buildingName}
                  </span>
                </div>
                {bldg.cameraUrl ? <CameraViewerButton /> : null}
              </div>

              <div>
                {isBuildingRinging ? (
                  <div className="animate-bounce mb-1">
                    <span className="inline-block px-2 py-1 bg-red-600 text-white text-xs font-bold rounded uppercase tracking-wider">
                      ¡Timbre Sonando!
                    </span>
                  </div>
                ) : null}
                <h3 className="text-xl font-bold text-white mb-1 drop-shadow-md">
                  {isBuildingRinging
                    ? `Unidad ${ringingLabel}`
                    : "Entrada Principal"}
                </h3>
                <p className="text-zinc-200 text-sm drop-shadow-md shadow-black">
                  {isBuildingRinging
                    ? "Alguien está en la puerta"
                    : "Sistema armado y seguro."}
                </p>
              </div>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
