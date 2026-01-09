"use client";

import { useState, useActionState } from "react";
import { ArrowLeft, Key, ShieldAlert, Loader2 } from "lucide-react";
import Link from "next/link";
import { changePassword } from "@/app/actions/user-settings";
import { toast } from "sonner";

export function SecuritySettings() {
  const [showChangePassword, setShowChangePassword] = useState(false);

  // Action state for form
  const [state, formAction, isPending] = useActionState(
    async (prev: any, formData: FormData) => {
      const res = await changePassword(prev, formData);
      if (res.success) {
        toast.success(res.message);
        setShowChangePassword(false);
      } else {
        toast.error(res.message);
      }
      return res;
    },
    null
  );

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link
          href="/dashboard/profile"
          className="p-2 rounded-full hover:bg-white/10 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-zinc-400" />
        </Link>
        <h1 className="text-xl font-bold text-white">Seguridad</h1>
      </div>

      <div className="bg-zinc-900/50 backdrop-blur-md border border-white/10 rounded-2xl overflow-hidden divide-y divide-white/5">
        {/* Toggle Form View */}
        {!showChangePassword ? (
          <div
            onClick={() => setShowChangePassword(true)}
            className="p-4 hover:bg-white/5 cursor-pointer transition-colors flex items-center justify-between group"
          >
            <div className="flex items-center gap-3">
              <Key className="w-5 h-5 text-zinc-500 group-hover:text-cyan-400 transition-colors" />
              <div className="text-left">
                <p className="text-sm font-medium text-zinc-200 group-hover:text-white">
                  Cambiar Contraseña
                </p>
                <p className="text-[10px] text-zinc-500">
                  Último cambio hace 30 días
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-6 bg-zinc-900/80 animate-in slide-in-from-top-2 fade-in duration-200">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-sm font-bold text-white">Nueva Contraseña</h3>
              <button
                onClick={() => setShowChangePassword(false)}
                className="text-xs text-zinc-500 hover:text-white"
              >
                Cancelar
              </button>
            </div>

            <form action={formAction} className="space-y-4">
              <input
                name="currentPassword"
                type="password"
                placeholder="Contraseña Actual"
                required
                className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:border-cyan-500 placeholder:text-zinc-600"
              />
              <input
                name="newPassword"
                type="password"
                placeholder="Nueva Contraseña"
                required
                minLength={6}
                className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:border-cyan-500 placeholder:text-zinc-600"
              />
              <button
                type="submit"
                disabled={isPending}
                className="w-full bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg py-2 text-sm font-bold transition-colors flex items-center justify-center gap-2"
              >
                {isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                {isPending ? "Actualizando..." : "Confirmar Cambio"}
              </button>
            </form>
          </div>
        )}

        <div className="p-4 hover:bg-rose-500/5 cursor-pointer transition-colors flex items-center justify-between group">
          <div className="flex items-center gap-3">
            <ShieldAlert className="w-5 h-5 text-rose-500/70 group-hover:text-rose-500 transition-colors" />
            <div className="text-left">
              <p className="text-sm font-medium text-zinc-200 group-hover:text-rose-400">
                Sesiones Activas
              </p>
              <p className="text-[10px] text-zinc-500">
                Cerrar todas las demás sesiones
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
