import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { AlertTriangle } from "lucide-react";
import { VirtualDevice } from "./virtual-device";

export default async function SimulatorPage() {
  const session = await auth();

  // Basic security check
  if (!session?.user) redirect("/login");

  // In a real app we might want to check for 'admin' role
  // if ((session.user as any).role !== "admin") redirect("/dashboard");

  // Fetch a unit to simulate
  // Ideally we let user pick one, but for now we pick the first one available
  const unit = await db.query.units.findFirst({
    with: {
      building: true,
    },
  });

  if (!unit) {
    return (
      <div className="p-8 text-center text-text-muted">
        No units found to simulate.
      </div>
    );
  }

  return (
    <div className="min-h-[85vh] flex flex-col justify-center items-center p-4">
      {/* Simulation Warning Banner */}
      <div className="w-full max-w-md bg-status-warning/10 border border-status-warning/20 rounded-xl p-3 flex items-start gap-3 mb-8">
        <AlertTriangle className="w-5 h-5 text-status-warning shrink-0 mt-0.5" />
        <div>
          <h3 className="text-status-warning font-bold text-sm">
            Entorno de Simulación
          </h3>
          <p className="text-status-warning/80 text-xs">
            Estás interactuando con un gemelo digital. Las acciones aquí generan
            eventos reales en la base de datos y notifican a los usuarios reales
            de{" "}
            <strong>
              {unit.label} ({unit.building?.name})
            </strong>
            .
          </p>
        </div>
      </div>

      <VirtualDevice
        unitId={unit.id}
        label={`${unit.building?.name} - ${unit.label}`}
      />

      <div className="mt-8 text-center space-y-2">
        <p className="text-text-muted text-xs font-mono">
          MQTT Topic: timbre-qr/{unit.building?.slug}/ring
        </p>
        <p className="text-text-muted text-[10px] font-mono uppercase opacity-70">
          Hardware ID: SIMULATOR-{unit.id.slice(0, 8)}
        </p>
      </div>
    </div>
  );
}
