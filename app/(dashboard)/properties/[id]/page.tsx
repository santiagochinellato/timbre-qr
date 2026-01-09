import { auth } from "@/lib/auth";
import { db } from "@/db";
import { accessLogs, units, buildings } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { redirect } from "next/navigation";
import { openDoor } from "@/app/actions/door";
import { Clock, Unlock } from "lucide-react";
import Image from "next/image";
import SlideSubmitWrapper from "./submit-wrapper";

export default async function PropertyDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  // Await params as per Next.js 15+
  const { id } = await params;

  // Fetch unit details
  const unit = await db
    .select({
      unitId: units.id,
      label: units.label,
      buildingName: buildings.name,
    })
    .from(units)
    .innerJoin(buildings, eq(units.buildingId, buildings.id))
    .where(eq(units.id, id))
    .limit(1)
    .then((res) => res[0]);

  if (!unit)
    return <div className="p-8 text-white">Propiedad no encontrada</div>;

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
      <div className="text-center mb-6">
        <h1 className="text-2xl font-bold text-white tracking-tight">
          {unit.buildingName}
        </h1>
        <p className="text-zinc-400 font-medium">Unidad {unit.label}</p>
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
            <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-black border border-white/10 shadow-inner">
              {activeRing.visitorPhotoUrl ? (
                <Image
                  src={activeRing.visitorPhotoUrl}
                  alt="Visitor"
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="h-full w-full flex items-center justify-center text-zinc-500">
                  Cámara desconectada
                </div>
              )}
              <div className="absolute top-3 left-3 px-2 py-1 bg-alert/80 backdrop-blur text-white text-[10px] font-bold rounded uppercase tracking-wider animate-pulse">
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
              {activeRing
                ? "Desliza abajo para abrir"
                : "Sistema de acceso activo"}
            </p>
          </div>

          {/* Action Slider */}
          {activeRing && (
            <div className="w-full">
              <form
                action={async () => {
                  "use server";
                  await openDoor(activeRing.id);
                }}
              >
                <SlideSubmitWrapper />
              </form>
            </div>
          )}
        </div>
      </div>

      {/* Compact History Log */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest px-2">
          Actividad Reciente
        </h3>
        <div className="space-y-1">
          {logs.map((log) => (
            <div
              key={log.id}
              className="flex items-center justify-between p-3 bg-zinc-900/50 border border-white/5 rounded-lg"
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-2 h-2 rounded-full ${
                    log.status === "opened" ? "bg-success" : "bg-alert"
                  }`}
                />
                <span
                  className={
                    log.status === "opened"
                      ? "text-zinc-300"
                      : "text-white font-medium"
                  }
                >
                  {log.status === "opened" ? "Puerta Abierta" : "Timbre Tocado"}
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-zinc-500 font-mono text-xs">
                <Clock className="w-3 h-3" />
                {log.createdAt
                  ? new Date(log.createdAt).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })
                  : "--:--"}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
