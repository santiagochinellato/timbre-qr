"use client";

import { useState } from "react";
import { updateProfile } from "@/app/actions/profile";
import { toast } from "sonner";
import { Loader2, Camera, Save } from "lucide-react";

export default function ProfileForm({ user }: { user: any }) {
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState(user.image);

  const handleSubmit = async (formData: FormData) => {
    setLoading(true);
    // If we have a file input, the Server Action will handle upload if integrated with `lib/storage`
    // Alternatively we can upload client side first.
    // For simplicity, we are passing the file directly to the server action.

    const res = await updateProfile(formData);
    setLoading(false);

    if (res.success) {
      toast.success(res.message);
    } else {
      toast.error(res.message);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setPreview(url);
    }
  };

  return (
    <div className="bg-bg-card backdrop-blur-md border border-border-subtle rounded-2xl p-6 relative overflow-hidden shadow-sm">
      {/* Decorative Blur */}
      <div className="absolute -top-20 -left-20 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

      <h2 className="text-xl font-bold text-text-main mb-8 relative z-10">
        Datos Personales
      </h2>

      <form action={handleSubmit} className="space-y-8 relative z-10">
        {/* Avatar Upload */}
        <div className="flex flex-col items-center gap-4">
          <div className="group relative w-28 h-28 rounded-full border-4 border-zinc-200 dark:border-zinc-800 bg-zinc-200 dark:bg-zinc-800 shadow-2xl overflow-hidden cursor-pointer transition-transform hover:scale-105">
            {preview ? (
              <img
                src={preview}
                alt="Profile"
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-4xl font-bold text-zinc-400 dark:text-zinc-600">
                {user.name?.charAt(0) || "U"}
              </div>
            )}
            {/* Overlay */}
            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all duration-300 backdrop-blur-sm">
              <Camera className="w-8 h-8 text-white drop-shadow-lg" />
            </div>
            <input
              type="file"
              name="image"
              accept="image/*"
              className="absolute inset-0 opacity-0 cursor-pointer"
              onChange={handleImageChange}
            />
          </div>
          <div className="text-center">
            <p className="text-sm font-bold text-text-main">Foto de Perfil</p>
            <p className="text-xs text-text-muted">
              Haz click en la imagen para cambiarla
            </p>
          </div>
        </div>

        {/* Inputs Grid */}
        <div className="grid gap-5">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-text-muted uppercase tracking-wider ml-1">
              Nombre Completo
            </label>
            <input
              name="name"
              defaultValue={user.name}
              className="w-full bg-zinc-100 dark:bg-black/40 border border-border-subtle dark:border-white/10 rounded-xl px-4 py-3 text-text-main dark:text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all placeholder:text-text-muted"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-text-muted uppercase tracking-wider ml-1">
              Correo Electrónico
            </label>
            <div className="relative opacity-80 dark:opacity-60">
              <input
                name="email"
                defaultValue={user.email}
                disabled
                className="w-full bg-zinc-100 dark:bg-black/40 border border-border-subtle dark:border-white/5 rounded-xl px-4 py-3 text-text-muted cursor-not-allowed"
              />
              <div className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-bold text-text-muted bg-black/5 dark:bg-white/5 px-2 py-0.5 rounded">
                LOCKED
              </div>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-text-muted uppercase tracking-wider ml-1">
              Teléfono
            </label>
            <input
              name="phone"
              defaultValue={user.phone}
              placeholder="+54 9 ..."
              className="w-full bg-zinc-100 dark:bg-black/40 border border-border-subtle dark:border-white/10 rounded-xl px-4 py-3 text-text-main dark:text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all placeholder:text-text-muted font-mono"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-primary text-white font-bold py-3.5 rounded-xl hover:bg-primary/90 hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center justify-center gap-2 shadow-lg shadow-primary/20"
        >
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Save className="w-5 h-5" />
          )}
          Guardar Cambios
        </button>
      </form>
    </div>
  );
}
