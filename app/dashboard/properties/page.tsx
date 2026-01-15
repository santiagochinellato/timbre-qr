import { auth } from "@/lib/auth";
import { db } from "@/db";
import { userUnits, units, buildings } from "@/db/schema";
import { eq } from "drizzle-orm";
import Link from "next/link";
import { redirect } from "next/navigation";

export default async function PropertiesPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  // Fetch units for the user
  // Joining userUnits -> units -> buildings
  const myUnits = await db
    .select({
      unitId: units.id,
      label: units.label,
      buildingName: buildings.name,
      role: userUnits.role,
    })
    .from(userUnits)
    .innerJoin(units, eq(userUnits.unitId, units.id))
    .innerJoin(buildings, eq(units.buildingId, buildings.id))
    .where(eq(userUnits.userId, session.user.id as string));

  // Group units by building
  const buildingsMap = new Map();
  myUnits.forEach((u) => {
    if (!buildingsMap.has(u.buildingName)) {
      buildingsMap.set(u.buildingName, {
        id: u.buildingName,
        name: u.buildingName,
        units: [],
        role: u.role,
      });
    }
    buildingsMap.get(u.buildingName).units.push(u);
  });

  const groupedBuildings = Array.from(buildingsMap.values());

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-text-main dark:text-white mb-2">
          Mis Propiedades
        </h1>
        <p className="text-text-muted dark:text-zinc-400">
          Selecciona un edificio para gestionar el acceso.
        </p>
      </div>

      {groupedBuildings.length === 0 ? (
        <div className="p-8 text-center bg-bg-card dark:bg-zinc-900/50 border border-border-subtle dark:border-white/10 rounded-2xl">
          <p className="text-text-muted dark:text-zinc-500">
            No tienes propiedades asignadas.
          </p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-2">
          {groupedBuildings.map((building) => (
            // Link to the FIRST unit of the building as a default entry point
            <Link
              key={building.name}
              href={`/dashboard/properties/${building.units[0].unitId}`}
              className="group relative h-64 rounded-3xl overflow-hidden border border-border-subtle dark:border-white/10 hover:border-primary/50 transition-all duration-500 hover:shadow-[0_0_40px_rgba(6,182,212,0.2)]"
            >
              {/* Background Image & Gradient */}
              <div className="absolute inset-0 bg-zinc-400 dark:bg-zinc-900">
                {(() => {
                  let bgImage =
                    "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=2070&auto=format&fit=crop";
                  if (building.name.includes("Complejo Cauquen"))
                    bgImage = "/edificio1.jpg";
                  if (building.name.includes("Cabañas"))
                    bgImage = "/edificio2.jpg";
                  if (building.name.includes("Las Victorias"))
                    bgImage = "/phPhoto.jpeg";

                  return (
                    <div
                      className="w-full h-full opacity-40 mix-blend-overlay bg-cover bg-center group-hover:scale-105 transition-transform duration-700"
                      style={{ backgroundImage: `url('${bgImage}')` }}
                    />
                  );
                })()}
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />
              </div>

              <div className="absolute inset-0 p-8 flex flex-col justify-end z-10">
                <div className="transform translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
                  <div className="flex items-center gap-2 mb-2">
                    <span
                      className={`px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded border bg-black/50 backdrop-blur border-white/10 text-white`}
                    >
                      {building.units.length} Unidades
                    </span>
                    {building.role === "owner" && (
                      <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded border bg-amber-500/20 border-amber-500/50 text-amber-500">
                        Propietario
                      </span>
                    )}
                  </div>
                  <h2 className="text-3xl font-bold text-white mb-1 leading-tight">
                    {building.name}
                  </h2>
                  <p className="text-zinc-400 text-sm flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    Sistema Online
                  </p>
                </div>

                <div className="mt-4 pt-4 border-t border-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <p className="text-xs text-zinc-400 truncate">
                    Unidades:{" "}
                    {building.units.map((u: any) => u.label).join(", ")}
                  </p>
                  <div className="flex items-center gap-2 mt-2 text-cyan-400 text-sm font-medium">
                    Ver Controles{" "}
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
                      <path d="M5 12h14" />
                      <path d="m12 5 7 7-7 7" />
                    </svg>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
