import { db } from "@/db";
import { accessLogs } from "@/db/schema";
import { desc, inArray } from "drizzle-orm";
import { Activity } from "lucide-react";
import Image from "next/image";

export async function ActivityFeed({ unitIds }: { unitIds: string[] }) {
  // Fetch recent logs
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

  return (
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
        {recentLogs.length === 0 ? (
          <div className="text-center text-text-muted py-10">
            No hay actividad reciente.
          </div>
        ) : (
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          recentLogs.map((log: any) => (
            <div
              key={log.id}
              className="flex items-center gap-4 p-4 rounded-2xl bg-bg-app hover:bg-zinc-100 dark:hover:bg-white/10 transition-colors border border-border-subtle"
            >
              <div className="flex-shrink-0">
                {log.visitorPhotoUrl &&
                !log.visitorPhotoUrl.startsWith("MSG:") ? (
                  <div className="w-14 h-14 rounded-xl overflow-hidden border border-border-subtle relative">
                    <Image
                      src={log.visitorPhotoUrl}
                      alt="Visitor"
                      width={56}
                      height={56}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="w-14 h-14 rounded-xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center border border-border-subtle dark:border-white/10 text-zinc-400 dark:text-zinc-500">
                    <Activity className="w-6 h-6" />
                  </div>
                )}
              </div>

              <div className="flex-1 min-w-0 flex flex-col gap-1">
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

                {log.unit && (
                  <div className="flex items-center gap-2 text-xs text-text-muted">
                    <span className="font-medium text-text-main">
                      {log.unit.building?.name || "Edificio"}
                    </span>
                    <span className="w-1 h-1 rounded-full bg-text-muted" />
                    <span>Unidad {log.unit.label}</span>
                  </div>
                )}

                {log.message && (
                  <div className="mt-1 bg-white dark:bg-zinc-800/50 border border-primary/20 dark:border-border-subtle rounded-lg px-3 py-1.5 inline-block self-start shadow-sm">
                    <p className="text-text-main dark:text-text-muted text-xs italic">
                      &quot;{log.message}&quot;
                    </p>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
