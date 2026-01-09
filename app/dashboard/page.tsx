import { auth } from "@/lib/auth";
import { db } from "@/db";
import { userUnits, units, buildings, accessLogs } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { redirect } from "next/navigation";
import { Battery, Activity, ShieldCheck, MapPin, Wifi } from "lucide-react";
import Link from "next/link";

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  // Fetch user's primary unit (first one found)
  // In a real app we might have a 'default' flag or active selection
  const userUnit = await db
    .select({
      unitId: units.id,
      unitLabel: units.label,
      buildingName: buildings.name,
      buildingSlug: buildings.slug,
    })
    .from(userUnits)
    .innerJoin(units, eq(userUnits.unitId, units.id))
    .innerJoin(buildings, eq(units.buildingId, buildings.id))
    .where(eq(userUnits.userId, session.user.id))
    .limit(1)
    .then((res) => res[0]);

  // Fetch generic activity stats
  const recentLogs = userUnit
    ? await db.query.accessLogs.findMany({
        where: eq(accessLogs.unitId, userUnit.unitId),
        orderBy: [desc(accessLogs.createdAt)],
        limit: 5,
      })
    : [];

  const activeRing = recentLogs.find((l) => l.status === "ringing");

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in zoom-in duration-500">
      {/* Header */}
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-zinc-400 text-sm font-medium uppercase tracking-wider">
            Centro de Comando
          </h2>
          <h1 className="text-3xl font-bold text-white tracking-tight">
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

      {!userUnit ? (
        <div className="p-8 border border-dashed border-white/10 rounded-2xl text-center">
          <p className="text-zinc-500">No tienes propiedades asignadas.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 auto-rows-[minmax(140px,auto)]">
          {/* Main Widget: Live Status / Door Card Link */}
          <Link
            href={`/dashboard/properties/${userUnit.unitId}`}
            className="col-span-1 md:col-span-2 row-span-2 relative group overflow-hidden rounded-3xl border border-white/10 bg-zinc-900/50 backdrop-blur-xl transition-all duration-300 hover:border-cyan-500/30"
          >
            <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/90 z-10" />

            {/* Bg Image Placeholder */}
            <div className="absolute inset-0 z-0 bg-zinc-800">
              <div className="w-full h-full opacity-30 mix-blend-overlay bg-[url('https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center group-hover:scale-105 transition-transform duration-700" />
            </div>

            <div className="relative z-20 p-6 h-full flex flex-col justify-between">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-2 bg-black/40 backdrop-blur rounded-full px-3 py-1.5 border border-white/5">
                  <MapPin className="w-3 h-3 text-cyan-400" />
                  <span className="text-xs font-medium text-white">
                    {userUnit.buildingName} • {userUnit.unitLabel}
                  </span>
                </div>
                {activeRing && (
                  <span className="flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-500"></span>
                  </span>
                )}
              </div>

              <div>
                <h3 className="text-2xl font-bold text-white mb-1">
                  {activeRing
                    ? "¡Alguien está en la puerta!"
                    : "Entrada Principal"}
                </h3>
                <p className="text-zinc-400 text-sm">
                  {activeRing
                    ? "Toca para ver la cámara"
                    : "Sistema armado y seguro."}
                </p>
              </div>
            </div>
          </Link>

          {/* Status Modules */}
          <div className="col-span-1 rounded-3xl bg-zinc-900/40 border border-white/5 p-5 flex flex-col justify-between hover:bg-zinc-900/60 transition-colors">
            <div className="flex justify-between items-start">
              <Wifi className="w-6 h-6 text-emerald-500" />
              <span className="text-xs text-zinc-500 font-mono">NET-5G</span>
            </div>
            <div>
              <div className="text-2xl font-bold text-white">Excelente</div>
              <div className="text-xs text-zinc-500">Señal de conexión</div>
            </div>
          </div>

          <div className="col-span-1 rounded-3xl bg-zinc-900/40 border border-white/5 p-5 flex flex-col justify-between hover:bg-zinc-900/60 transition-colors">
            <div className="flex justify-between items-start">
              <Battery className="w-6 h-6 text-cyan-500" />
              <span className="text-xs text-zinc-500 font-mono">PWR</span>
            </div>
            <div>
              <div className="text-2xl font-bold text-white">100%</div>
              <div className="text-xs text-zinc-500">Batería del sistema</div>
            </div>
          </div>

          {/* Recent Activity Mini-List */}
          <div className="col-span-1 md:col-span-1 rounded-3xl bg-zinc-900/40 border border-white/5 p-5 flex flex-col">
            <div className="flex items-center gap-2 mb-4">
              <Activity className="w-4 h-4 text-purple-400" />
              <span className="text-sm font-bold text-white">
                Actividad Reciente
              </span>
            </div>
            <div className="space-y-3 flex-1 overflow-hidden">
              {recentLogs.length === 0 ? (
                <p className="text-xs text-zinc-600">
                  Sin actividad registrada.
                </p>
              ) : (
                recentLogs.slice(0, 3).map((log) => (
                  <div key={log.id} className="flex items-center gap-3 text-xs">
                    <div
                      className={`w-1.5 h-1.5 rounded-full ${
                        log.status === "opened"
                          ? "bg-emerald-500"
                          : "bg-amber-500"
                      }`}
                    />
                    <span className="text-zinc-300 truncate flex-1">
                      {log.status === "opened" ? "Puerta abierta" : "Timbre"}
                    </span>
                    <span
                      className="text-zinc-500 font-mono text-[10px]"
                      suppressHydrationWarning
                    >
                      {log.createdAt
                        ? new Date(log.createdAt).toLocaleString("es-AR", {
                            timeZone: "America/Argentina/Buenos_Aires",
                            hour: "2-digit",
                            minute: "2-digit",
                            hour12: true,
                          })
                        : ""}
                    </span>
                  </div>
                ))
              )}
            </div>
            <Link
              href="/dashboard/activity"
              className="text-[10px] text-zinc-500 hover:text-white mt-3 block text-right transition-colors"
            >
              Ver todo →
            </Link>
          </div>

          {/* Quick Actions / Panic */}
          <div className="col-span-1 md:col-span-2 rounded-3xl bg-gradient-to-r from-zinc-900 to-zinc-800 border border-white/5 p-1 relative overflow-hidden group">
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10" />
            <div className="relative z-10 h-full flex items-center justify-between px-6 py-4">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-black/50 rounded-full border border-white/10">
                  <ShieldCheck className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h4 className="text-white font-bold">Modo Seguro Activo</h4>
                  <p className="text-zinc-400 text-xs">
                    Todos los sensores operando normal.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
