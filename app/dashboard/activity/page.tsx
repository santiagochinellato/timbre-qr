import { auth } from "@/lib/auth";
import { db } from "@/db";
import { accessLogs, units, userUnits } from "@/db/schema";
import { eq, desc, inArray } from "drizzle-orm";
import { redirect } from "next/navigation";
import Image from "next/image";
import { CheckCircle2, XCircle, BellRing, Activity } from "lucide-react";

export default async function ActivityPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  // Get all unit IDs for the user
  const myUnits = await db
    .select({ id: units.id })
    .from(userUnits)
    .innerJoin(units, eq(userUnits.unitId, units.id))
    .where(eq(userUnits.userId, session.user.id));

  const unitIds = myUnits.map((u) => u.id);

  // If no units, valid to show empty state
  if (unitIds.length === 0) {
    return (
      <div className="max-w-2xl mx-auto p-8 text-center border border-white/10 rounded-2xl bg-zinc-900/30">
        <h2 className="text-xl font-bold text-white mb-2">Sin actividad</h2>
        <p className="text-zinc-500">No tienes propiedades asignadas.</p>
      </div>
    );
  }

  const logs = await db.query.accessLogs.findMany({
    where: inArray(accessLogs.unitId, unitIds),
    with: {
      unit: {
        with: {
          building: true,
        },
      },
      opener: true,
    },
    orderBy: [desc(accessLogs.createdAt)],
    limit: 50,
  });

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white tracking-tight">
          Historial de Calidad
        </h1>
        <span className="text-xs font-mono text-zinc-500">
          ÚLTIMOS 50 EVENTOS
        </span>
      </div>

      <div className="space-y-4">
        {logs.length === 0 ? (
          <p className="text-zinc-500 text-center py-10">
            No hay registros de actividad aún.
          </p>
        ) : (
          logs.map((log) => (
            <div
              key={log.id}
              className="group relative bg-zinc-900/40 backdrop-blur-md border border-white/5 rounded-xl p-4 transition-all hover:bg-zinc-900/60 hover:border-white/10"
            >
              <div className="flex gap-4">
                {/* Timestamp Column */}
                <div className="flex flex-col items-center gap-1 min-w-[3rem] border-r border-white/5 pr-4 justify-start pt-1">
                  <span
                    className="text-lg font-bold text-zinc-300 font-mono"
                    suppressHydrationWarning
                  >
                    {log.createdAt
                      ? new Date(log.createdAt).toLocaleTimeString("es-AR", {
                          hour: "2-digit",
                          minute: "2-digit",
                          timeZone: "America/Argentina/Buenos_Aires",
                        })
                      : "--:--"}
                  </span>
                  <span
                    className="text-[10px] text-zinc-600 font-mono uppercase"
                    suppressHydrationWarning
                  >
                    {log.createdAt
                      ? new Date(log.createdAt).toLocaleDateString("es-AR", {
                          weekday: "short",
                          timeZone: "America/Argentina/Buenos_Aires",
                        })
                      : ""}
                  </span>
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0 flex flex-col gap-1">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <StatusIcon status={log.status} />
                      <span
                        className={`text-sm font-medium ${getStatusColor(
                          log.status
                        )}`}
                      >
                        {getStatusText(log.status)}
                      </span>
                    </div>
                  </div>

                  {/* Location Details */}
                  {log.unit && (
                    <div className="flex items-center gap-2 text-xs text-zinc-400 mb-2">
                      <span className="font-medium text-zinc-300">
                        {log.unit.building?.name || "Edificio"}
                      </span>
                      <span className="w-1 h-1 rounded-full bg-zinc-600" />
                      <span>Unidad {log.unit.label}</span>
                    </div>
                  )}

                  {/* Message or Authorizer */}
                  {log.message ? (
                    <div className="bg-zinc-800/50 border border-white/5 rounded-lg px-3 py-2 inline-block self-start mb-2">
                      <p className="text-zinc-300 text-sm italic">
                        &quot;{log.message}&quot;
                      </p>
                    </div>
                  ) : null}

                  {/* Authorizer (Who opened it) */}
                  {log.status === "opened" && log.opener && (
                    <div className="flex items-center gap-1 text-[10px] text-emerald-500/80 uppercase tracking-wide font-bold mb-2">
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

                  {log.visitorPhotoUrl &&
                    !log.visitorPhotoUrl.startsWith("MSG:") && (
                      <div className="relative w-full aspect-video rounded-lg overflow-hidden border border-white/5 mt-1">
                        <Image
                          src={log.visitorPhotoUrl}
                          fill
                          className="object-cover opacity-90 group-hover:opacity-100 transition-opacity"
                          alt="Visitor"
                        />
                      </div>
                    )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function StatusIcon({ status }: { status: string | null }) {
  switch (status) {
    case "opened":
      return <CheckCircle2 className="w-4 h-4 text-emerald-500" />;
    case "ringing":
      return <BellRing className="w-4 h-4 text-amber-500 animate-pulse" />;
    case "missed":
      return <XCircle className="w-4 h-4 text-rose-500" />;
    default:
      return <Activity className="w-4 h-4 text-zinc-500" />;
  }
}

function getStatusText(status: string | null) {
  switch (status) {
    case "opened":
      return "Acceso Permitido";
    case "ringing":
      return "Timbre Tocado";
    case "missed":
      return "No Atendido";
    default:
      return "Evento";
  }
}

function getStatusColor(status: string | null) {
  switch (status) {
    case "opened":
      return "text-emerald-400";
    case "ringing":
      return "text-amber-400";
    case "missed":
      return "text-rose-400";
    default:
      return "text-zinc-400";
  }
}
