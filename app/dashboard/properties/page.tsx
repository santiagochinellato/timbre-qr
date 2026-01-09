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

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Mis Propiedades</h1>

      {myUnits.length === 0 ? (
        <div className="p-8 text-center bg-white rounded-lg shadow">
          <p className="text-gray-500">No tienes propiedades asignadas.</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {myUnits.map((item) => (
            <Link
              key={item.unitId}
              href={`/properties/${item.unitId}`}
              className="block bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow border border-gray-100"
            >
              <h2 className="text-lg font-semibold text-gray-900">
                {item.buildingName}
              </h2>
              <p className="text-gray-500 mt-1">Unidad: {item.label}</p>
              <span className="inline-block mt-3 px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded">
                {item.role}
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
