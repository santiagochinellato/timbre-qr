import { auth } from "@/lib/auth";
import { db } from "@/db";
import { redirect } from "next/navigation";
import AdminTools from "@/components/profile/admin-tools";
import { Settings } from "lucide-react";

export default async function SettingsPage() {
  console.log("Loading Settings Page...");
  const session = await auth();
  if (!session?.user) redirect("/login");

  if ((session.user as any).role !== "admin") {
    redirect("/dashboard");
  }

  const allBuildings = await db.query.buildings.findMany();
  const allUnits = await db.query.units.findMany({
    with: { building: true },
    orderBy: (units, { asc }) => [asc(units.label)],
  });
  const allUsers = await db.query.users.findMany({
    orderBy: (users, { desc }) => [desc(users.createdAt)],
  });

  // Fetch active guest assignments
  const guestAssignments = await db.query.userUnits.findMany({
    where: (userUnits, { eq }) => eq(userUnits.role, "guest"),
    with: {
      user: true,
      unit: {
        with: { building: true },
      },
    },
  });

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-20">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-cyan-500/10 flex items-center justify-center">
          <Settings className="w-6 h-6 text-cyan-500" />
        </div>
        <h1 className="text-2xl font-bold text-white tracking-tight">
          Configuración
        </h1>
      </div>

      <p className="text-zinc-400">
        Panel de administración para gestionar edificios, unidades y accesos.
      </p>

      {/* Admin Tools */}
      <AdminTools
        buildings={allBuildings}
        units={allUnits}
        users={allUsers}
        guests={guestAssignments}
      />
    </div>
  );
}
