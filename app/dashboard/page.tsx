import { auth } from "@/lib/auth";
import { db } from "@/db";
import { userUnits, units, buildings, accessLogs, users } from "@/db/schema";
import { eq, desc, inArray } from "drizzle-orm";
import { redirect } from "next/navigation";
import { Activity, MapPin } from "lucide-react";
import Link from "next/link";
import { CameraViewerButton } from "@/components/features/camera-viewer-button";

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  // Fetch user's primary unit (first one found)
  // 1. Validate User Exists (Session might be stale after DB reset)
  const dbUser = await db.query.users.findFirst({
    where: eq(users.id, session.user.id),
  });

  if (!dbUser) {
    // Session is valid (signed correctly) but user is gone from DB.
    // Force redirect to logout to clear the bad session.
    redirect("/logout");
  }

  // 2. Fetch ALL units to group them
  const allUserUnits = await db
    .select({
      unitId: units.id,
      unitLabel: units.label,
      buildingName: buildings.name,
      buildingSlug: buildings.slug,
    })
    .from(userUnits)
    .innerJoin(units, eq(userUnits.unitId, units.id))
    .innerJoin(buildings, eq(units.buildingId, buildings.id))
    .where(eq(userUnits.userId, session.user.id));

  // Group by Building
  const buildingsMap = new Map();
  allUserUnits.forEach((u) => {
    if (!buildingsMap.has(u.buildingName)) {
      buildingsMap.set(u.buildingName, u);
    }
  });
  const uniqueBuildings = Array.from(buildingsMap.values());

  // 3. Fetch generic activity stats for ALL units
  const unitIds = allUserUnits.map((u) => u.unitId);

  const recentLogs =
    unitIds.length > 0
      ? await db.query.accessLogs.findMany({
          where: inArray(accessLogs.unitId, unitIds),
          orderBy: [desc(accessLogs.createdAt)],
          limit: 10,
          with: {
            unit: {
              with: {
                building: true,
              },
            },
            opener: true,
          },
        })
      : [];

  // 4. Check for ANY active ringing state across ALL units
  // We need to know which units are ringing to animate the correct building card

  // Use a raw query or findMany with 'inArray' if available, or just fetch recent logs for all active units
  // For simplicity and to avoid importing 'inArray', let's just fetch active ringing logs
  // We can optimize this later if the user has 100s of units.
  const activeRings = await db.query.accessLogs.findMany({
    where: (logs, { and, inArray, eq, gt }) =>
      and(
        inArray(logs.unitId, unitIds),
        eq(logs.status, "ringing"),
        gt(logs.createdAt, new Date(Date.now() - 2 * 60 * 1000)) // eslint-disable-line
      ),
    with: {
      unit: true,
    },
    columns: { unitId: true },
  });

  const ringingUnitIds = new Set(activeRings.map((r) => r.unitId));

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

      {!uniqueBuildings.length ? (
        <div className="p-8 border border-dashed border-border-subtle rounded-2xl text-center">
          <p className="text-text-muted">No tienes propiedades asignadas.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Render a Card for EACH Building */}
          {uniqueBuildings.map((bldg) => {
            // Check if this building has any ringing unit
            // Since 'uniqueBuildings' only has one entry per building (the first unit found),
            // we technically need to check ALL units associated with this building.
            // However, 'allUserUnits' has all of them.

            // Find the active ring for this building
            const activeRingForBuilding = activeRings.find((r) =>
              allUserUnits.some(
                (u) =>
                  u.unitId === r.unitId && u.buildingName === bldg.buildingName
              )
            );

            const isBuildingRinging = !!activeRingForBuilding;
            const ringingLabel = activeRingForBuilding?.unit?.label;

            return (
              <Link
                key={bldg.buildingSlug}
                href={`/dashboard/properties/${
                  activeRingForBuilding
                    ? activeRingForBuilding.unitId
                    : bldg.unitId
                }`} // Direct to ringing unit if active
                className={`col-span-1 relative group overflow-hidden rounded-3xl border bg-bg-card backdrop-blur-xl transition-all duration-300 h-64 ${
                  isBuildingRinging
                    ? "border-status-alert/80 shadow-[0_0_50px_rgba(239,68,68,0.4)] animate-pulse"
                    : "border-border-subtle hover:border-primary/50 shadow-sm"
                }`}
              >
                <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/90 z-10" />

                {/* Bg Image Placeholder */}
                <div className="absolute inset-0 z-0  dark:bg-zinc-600 bg-zinc-400">
                  {(() => {
                    let bgImage =
                      "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=2070&auto=format&fit=crop";
                    const name = bldg.buildingName || "";
                    if (name.includes("Demo Center"))
                      bgImage = "/edificio1.jpg";
                    if (name.includes("Cabañas")) bgImage = "/edificio2.jpg";
                    if (name.includes("Las Victorias"))
                      bgImage = "/phPhoto.jpeg";

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
                    {/* Camera Button Component */}
                    <CameraViewerButton />
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
                      {/* Show Unit Label if Ringing, else generic entrance */}
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
      )}

      {/* Secondary Status Section */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* 
        <div className="col-span-1 rounded-3xl bg-zinc-900/40 border border-white/5 p-5 flex flex-col justify-between hover:bg-zinc-900/60 transition-colors">
          <div className="flex justify-between items-start">
            <Wifi className="w-6 h-6 text-emerald-500" />
            <span className="text-xs text-zinc-500 font-mono">NET</span>
          </div>
          <div>
            <div className="text-xl font-bold text-white">5G</div>
            <div className="text-xs text-zinc-500">Conectado</div>
          </div>
        </div>

        <div className="col-span-1 rounded-3xl bg-zinc-900/40 border border-white/5 p-5 flex flex-col justify-between hover:bg-zinc-900/60 transition-colors">
          <div className="flex justify-between items-start">
            <Battery className="w-6 h-6 text-cyan-500" />
            <span className="text-xs text-zinc-500 font-mono">PWR</span>
          </div>
          <div>
            <div className="text-xl font-bold text-white">100%</div>
            <div className="text-xs text-zinc-500">Batería</div>
          </div>
        </div> 
        */}

        {/* Recent Activity List (Expanded) */}
        <div className="col-span-2 md:col-span-4 rounded-3xl bg-bg-card border border-border-subtle p-6 flex flex-col min-h-[300px] shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="bg-purple-500/10 p-2 rounded-xl">
              <Activity className="w-5 h-5 text-purple-500" />
            </div>
            <span className="text-lg font-bold text-text-main">
              Actividad Reciente
            </span>
          </div>

          <div className="space-y-4 flex-1">
            {(() => {
              const mockNow = new Date().getTime();
              const mockLogs = [
                {
                  id: "mock-1",
                  status: "ringing",
                  createdAt: new Date(mockNow - 1000 * 60 * 5),
                  visitorPhotoUrl:
                    "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=200&auto=format&fit=crop",
                  message: null,
                  unit: { label: "2A", building: { name: "Edificio Demo" } },
                  opener: null,
                },
                {
                  id: "mock-2",
                  status: "opened",
                  createdAt: new Date(mockNow - 1000 * 60 * 25),
                  visitorPhotoUrl: null,
                  message: "Hola, soy del correo, dejo paquete.",
                  unit: { label: "PB B", building: { name: "Cabañas" } },
                  opener: { name: "Maria Gonzalez" },
                },
                {
                  id: "mock-3",
                  status: "missed",
                  createdAt: new Date(mockNow - 1000 * 60 * 60 * 2),
                  visitorPhotoUrl:
                    "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=200&auto=format&fit=crop",
                  message: "Vecino del 5to",
                  unit: { label: "4C", building: { name: "Edificio Demo" } },
                  opener: null,
                },
                {
                  id: "mock-4",
                  status: "opened",
                  createdAt: new Date(mockNow - 1000 * 60 * 60 * 24),
                  visitorPhotoUrl:
                    "https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=200&auto=format&fit=crop",
                  message: null,
                  unit: { label: "1A", building: { name: "Las Victorias" } },
                  opener: { name: "Carlos Gomez" },
                },
                {
                  id: "mock-5",
                  status: "ringing",
                  createdAt: new Date(mockNow - 1000 * 60 * 60 * 25),
                  visitorPhotoUrl: null,
                  message: null,
                  unit: { label: "2A", building: { name: "Edificio Demo" } },
                  opener: null,
                },
              ];

              const displayLogs = recentLogs.length > 0 ? recentLogs : mockLogs;

              if (displayLogs.length === 0) {
                return (
                  <div className="text-center text-text-muted py-10">
                    No hay actividad reciente.
                  </div>
                );
              }

              return displayLogs.map((log: any) => (
                <div
                  key={log.id}
                  className="flex items-center gap-4 p-4 rounded-2xl bg-bg-app hover:bg-zinc-100 dark:hover:bg-white/10 transition-colors border border-border-subtle"
                >
                  {/* Avatar / Photo */}
                  <div className="flex-shrink-0">
                    {log.visitorPhotoUrl &&
                    !log.visitorPhotoUrl.startsWith("MSG:") ? (
                      <div className="w-14 h-14 rounded-xl overflow-hidden border border-border-subtle relative">
                        <img
                          src={log.visitorPhotoUrl}
                          alt="Visitor"
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ) : (
                      <div className="w-14 h-14 rounded-xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center border border-border-subtle dark:border-white/10 text-zinc-400 dark:text-zinc-500">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="24"
                          height="24"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                          <circle cx="12" cy="7" r="4" />
                        </svg>
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0 flex flex-col gap-1">
                    {/* Top Row: Status & Time */}
                    <div className="flex justify-between items-center">
                      <p className="font-bold text-base">
                        {log.status === "opened" ? (
                          <span className="text-status-success">
                            Acceso Permitido
                          </span>
                        ) : log.status === "ringing" ? (
                          <span className="text-amber-500">Timbre</span>
                        ) : (
                          <span className="text-status-alert">No Atendido</span>
                        )}
                      </p>
                      <span className="text-xs text-text-muted whitespace-nowrap">
                        {log.createdAt
                          ? new Date(log.createdAt).toLocaleString("es-AR", {
                              hour: "2-digit",
                              minute: "2-digit",
                              day: "2-digit",
                              month: "2-digit",
                              timeZone: "America/Argentina/Buenos_Aires",
                            })
                          : "-"}
                      </span>
                    </div>

                    {/* Middle Row: Location Details */}
                    {log.unit && (
                      <div className="flex items-center gap-2 text-xs text-text-muted">
                        <span className="font-medium text-text-main">
                          {log.unit.building?.name || "Edificio"}
                        </span>
                        <span className="w-1 h-1 rounded-full bg-text-muted" />
                        <span>Unidad {log.unit.label}</span>
                      </div>
                    )}

                    {/* Bottom Row: Message or Authorizer */}
                    {log.message ? (
                      <div className="mt-1 bg-white dark:bg-zinc-800/50 border border-primary/20 dark:border-border-subtle rounded-lg px-3 py-1.5 inline-block self-start shadow-sm">
                        <p className="text-text-main dark:text-text-muted text-xs italic">
                          &quot;{log.message}&quot;
                        </p>
                      </div>
                    ) : (
                      <p className="text-xs text-text-muted mt-0.5">
                        {log.visitorPhotoUrl
                          ? "Visitante con foto capturada"
                          : "Sin registro visual"}
                      </p>
                    )}

                    {/* Authorizer (Who opened it) */}
                    {log.status === "opened" && log.opener && (
                      <div className="flex items-center gap-1 mt-1 text-[10px] text-emerald-500/80 uppercase tracking-wide font-bold">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="12"
                          height="12"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                        </svg>
                        <span>
                          Autorizado por: {log.opener.name || "Usuario"}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              ));
            })()}
          </div>
        </div>
      </div>
    </div>
  );
}
