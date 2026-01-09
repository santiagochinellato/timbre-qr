import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { User, Settings, Shield, LogOut } from "lucide-react";

export default async function ProfilePage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  return (
    <div className="max-w-xl mx-auto space-y-8">
      <h1 className="text-2xl font-bold text-white tracking-tight">
        Mi Perfil
      </h1>

      <div className="bg-zinc-900/50 backdrop-blur-md border border-white/10 rounded-2xl p-6 flex items-center gap-6">
        <div className="w-20 h-20 rounded-full bg-zinc-800 flex items-center justify-center text-3xl font-bold text-cyan-500 border border-white/5">
          {session.user.name?.charAt(0) || "U"}
        </div>
        <div>
          <h2 className="text-xl font-bold text-white">{session.user.name}</h2>
          <p className="text-zinc-500">{session.user.email}</p>
          <div className="flex gap-2 mt-2">
            <span className="px-2 py-1 rounded-md bg-white/5 text-xs text-zinc-400 border border-white/5 uppercase tracking-wider font-mono">
              {session.user.role || "Resident"}
            </span>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest px-2">
          Configuración
        </h3>
        <div className="bg-zinc-900/30 border border-white/5 rounded-xl overflow-hidden divide-y divide-white/5">
          <ListItem icon={Settings} label="Preferencias de Notificación" />
          <ListItem icon={Shield} label="Seguridad y Clave" />
        </div>
      </div>

      <button className="w-full py-4 text-rose-500 font-medium hover:bg-rose-500/10 rounded-xl transition-colors flex items-center justify-center gap-2">
        <LogOut className="w-4 h-4" />
        Cerrar Sesión
      </button>
    </div>
  );
}

function ListItem({ icon: Icon, label }: { icon: any; label: string }) {
  return (
    <div className="p-4 flex items-center justify-between hover:bg-white/5 cursor-pointer transition-colors group">
      <div className="flex items-center gap-3">
        <Icon className="w-5 h-5 text-zinc-500 group-hover:text-cyan-400 transition-colors" />
        <span className="text-zinc-300 group-hover:text-white transition-colors">
          {label}
        </span>
      </div>
      {/* Chevron? */}
    </div>
  );
}
