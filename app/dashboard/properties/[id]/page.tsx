import { auth } from "@/lib/auth";
import { db } from "@/db";
import { accessLogs, units, buildings, userUnits } from "@/db/schema";
import { eq, desc, and, ne } from "drizzle-orm";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Unlock } from "lucide-react";
import Image from "next/image";
import OpenDoorControl from "@/components/features/open-door-control";

export default async function PropertyDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  // Await params as per Next.js 15+
  const { id } = await params;

  // Fetch unit details with MQTT topics
  const unit = await db
    .select({
      unitId: units.id,
      label: units.label,
      unitMqttTopic: units.mqttTopic,
      buildingId: units.buildingId,
      buildingName: buildings.name,
      buildingMqttTopic: buildings.mqttTopic,
    })
    .from(units)
    .innerJoin(buildings, eq(units.buildingId, buildings.id))
    .where(eq(units.id, id))
    .limit(1)
    .then((res) => res[0]);

  if (!unit)
    return <div className="p-8 text-white">Propiedad no encontrada</div>;

  // Fetch sibling units (other units in the same building for this user)
  let siblingUnits: { unitId: string; label: string }[] = [];

  if (unit.buildingId) {
    siblingUnits = await db
      .select({
        unitId: units.id,
        label: units.label,
      })
      .from(userUnits)
      .innerJoin(units, eq(userUnits.unitId, units.id))
      .where(
        and(
          eq(userUnits.userId, session.user.id as string),
          eq(units.buildingId, unit.buildingId),
          ne(units.id, id)
        )
      );
  }

  // Fetch logs
  const logs = await db.query.accessLogs.findMany({
    where: eq(accessLogs.unitId, id),
    orderBy: [desc(accessLogs.createdAt)],
    limit: 20,
  });

  const activeRing = logs.find((l) => l.status === "ringing");

  return (
    <div className="max-w-md mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Link
          href="/dashboard"
          className="p-2 rounded-full hover:bg-white/10 transition-colors"
        >
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
            className="text-zinc-400"
          >
            <path d="m15 18-6-6 6-6" />
          </svg>
        </Link>
        <div className="text-left">
          <h1 className="text-xl font-bold text-white tracking-tight">
            {unit.buildingName}
          </h1>
          <p className="text-zinc-400 text-sm font-medium">
            Unidad {unit.label}
          </p>
        </div>
      </div>

      {/* Dynamic Door Card */}
      <div className="relative bg-bg-card backdrop-blur-xl border border-border-subtle rounded-2xl overflow-hidden shadow-2xl transition-all duration-500">
        {/* Status Indicator */}
        <div
          className={`h-1 w-full ${
            activeRing ? "bg-alert animate-pulse" : "bg-success"
          }`}
        />

        <div className="p-6 flex flex-col items-center gap-6">
          {/* Ringing Visual */}
          {activeRing ? (
            <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-black border border-white/10 shadow-inner flex flex-col">
              {activeRing.visitorPhotoUrl &&
              !activeRing.visitorPhotoUrl.startsWith("MSG:") ? (
                <>
                  <Image
                    src={activeRing.visitorPhotoUrl}
                    alt="Visitor"
                    fill
                    className="object-cover"
                  />
                  {/* Overlay Message if Photo Exists */}
                  {activeRing.message && (
                    <div className="absolute bottom-0 inset-x-0 bg-black/60 backdrop-blur-sm p-3 text-center">
                      <p className="text-white text-sm font-medium italic">
                        "{activeRing.message}"
                      </p>
                    </div>
                  )}
                </>
              ) : (
                <div className="h-full w-full flex flex-col items-center justify-center p-6 text-center">
                  {activeRing.message ? (
                    <div className="space-y-2">
                      <span className="text-zinc-500 text-xs uppercase tracking-widest font-bold">
                        Mensaje del Visitante
                      </span>
                      <p className="text-white text-xl md:text-2xl font-serif italic leading-relaxed">
                        "{activeRing.message}"
                      </p>
                    </div>
                  ) : (
                    <div className="text-zinc-500 flex flex-col items-center gap-2">
                      <span className="text-sm">Cámara desconectada</span>
                    </div>
                  )}
                </div>
              )}
              <div className="absolute top-3 left-3 px-2 py-1 bg-alert/80 backdrop-blur text-white text-[10px] font-bold rounded uppercase tracking-wider animate-pulse z-10">
                Live
              </div>
            </div>
          ) : (
            <div className="w-24 h-24 rounded-full bg-zinc-800/50 flex items-center justify-center border border-white/5">
              <Unlock className="w-10 h-10 text-zinc-600" />
            </div>
          )}

          {/* Status Text */}
          <div className="text-center">
            <h2
              className={`text-xl font-bold ${
                activeRing ? "text-white" : "text-zinc-500"
              }`}
            >
              {activeRing ? "Están tocando timbre" : "Puerta Segura"}
            </h2>
            <p className="text-sm text-zinc-400 mt-1">
              {activeRing ? "Autoriza el acceso" : "Sistema de acceso activo"}
            </p>
          </div>

          {/* Actions */}
          {activeRing && (
            <div className="w-full space-y-3">
              {/* Option 1: Open Main Gate (If configured) */}
              {unit.buildingMqttTopic && (
                <OpenDoorControl
                  key="main-gate"
                  logId={activeRing.id}
                  type="building"
                  label="Entrada Principal"
                />
              )}

              {/* Option 2: Open Unit Door (If configured) */}
              {unit.unitMqttTopic && (
                <OpenDoorControl
                  key="unit-door"
                  logId={activeRing.id}
                  type="unit"
                  label={
                    unit.buildingMqttTopic
                      ? "Entrada Departamento"
                      : "Entrada Única"
                  }
                  className="mt-2"
                />
              )}

              {/* Fallback if no specific configuration (Legacy behavior) */}
              {!unit.buildingMqttTopic && !unit.unitMqttTopic && (
                <OpenDoorControl
                  key="default-door"
                  logId={activeRing.id}
                  type="default"
                  label="Entrada Principal"
                />
              )}
            </div>
          )}
        </div>
      </div>

      {/* Recent Visitor Gallery */}
      <div className="space-y-4">
        <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest px-2">
          Últimas Aperturas
        </h3>
        <div className="grid grid-cols-5 gap-3">
          {logs.slice(0, 5).map((log) => (
            <div
              key={log.id}
              className="flex flex-col items-center gap-2 group"
            >
              <div
                className={`w-14 h-14 rounded-2xl overflow-hidden border-2 transition-colors relative ${
                  log.status === "opened"
                    ? "border-emerald-500/30 group-hover:border-emerald-500"
                    : "border-red-500/30 group-hover:border-red-500"
                }`}
              >
                {log.visitorPhotoUrl ? (
                  <Image
                    src={log.visitorPhotoUrl}
                    alt="Visitor"
                    fill
                    className="object-cover"
                    sizes="64px"
                  />
                ) : (
                  <div className="w-full h-full bg-zinc-800 flex items-center justify-center text-zinc-600">
                    <span className="text-[10px]">Sin Foto</span>
                  </div>
                )}
              </div>
              <span
                className="text-[10px] text-zinc-500 font-mono"
                suppressHydrationWarning
              >
                {log.createdAt
                  ? new Date(log.createdAt).toLocaleTimeString("es-AR", {
                      hour: "2-digit",
                      minute: "2-digit",
                      timeZone: "America/Argentina/Buenos_Aires",
                    })
                  : ""}
              </span>
            </div>
          ))}
          {logs.length === 0 && (
            <div className="col-span-5 text-center py-4 text-zinc-600 text-sm">
              Sin actividad reciente
            </div>
          )}
        </div>
      </div>

      {/* Sibling Units Grid */}
      {siblingUnits.length > 0 && (
        <div className="space-y-4 pt-4 border-t border-white/5">
          <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest px-2">
            Otras Unidades en {unit.buildingName}
          </h3>
          <div className="grid grid-cols-2 gap-4">
            {siblingUnits.map((sibling) => (
              <Link
                key={sibling.unitId}
                href={`/dashboard/properties/${sibling.unitId}`}
                className="group p-4 bg-zinc-900/50 border border-white/10 rounded-2xl hover:bg-zinc-800 hover:border-cyan-500/30 transition-all flex items-center justify-between"
              >
                <div>
                  <div className="text-xs text-zinc-500 font-medium uppercase mb-1">
                    Unidad
                  </div>
                  <div className="text-lg font-bold text-white group-hover:text-cyan-400 transition-colors">
                    {sibling.label}
                  </div>
                </div>
                <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-cyan-500/20 group-hover:text-cyan-400 transition-colors">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="m9 18 6-6-6-6" />
                  </svg>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
