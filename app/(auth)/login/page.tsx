"use client";

import { useActionState } from "react";
import { authenticate } from "@/app/actions/auth";
import Image from "next/image";

export default function LoginPage() {
  const [errorMessage, dispatch, isPending] = useActionState(
    authenticate,
    undefined
  );

  return (
    <div className="flex h-screen items-center justify-center bg-bg-app font-sans">
      <form
        action={dispatch}
        className="flex flex-col gap-5 rounded-2xl bg-zinc-900/50 backdrop-blur-md border border-white/10 p-8 shadow-[0_0_40px_rgba(0,0,0,0.3)] w-full max-w-sm"
      >
        <div className="flex justify-center mb-2">
          <Image
            src="/icons/GbellzWhite.webp"
            alt="Gbellz Logo"
            width={104}
            height={104}
            className="w-28 h-28 object-contain drop-shadow-[0_0_15px_rgba(255,255,255,0.1)]"
          />
        </div>
        <h1 className="text-2xl font-bold text-center mb-6 text-white tracking-tight">
          Iniciar Sesión
        </h1>

        <div>
          <label className="block text-xs font-bold text-zinc-500 uppercase tracking-widest mb-1.5 ml-1">
            Email
          </label>
          <input
            className="block w-full rounded-xl bg-black/40 border border-white/10 px-4 py-3 text-white placeholder-zinc-600 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500 transition-all text-sm"
            id="email"
            type="email"
            name="email"
            placeholder="admin@example.com"
            required
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-zinc-500 uppercase tracking-widest mb-1.5 ml-1">
            Contraseña
          </label>
          <input
            className="block w-full rounded-xl bg-black/40 border border-white/10 px-4 py-3 text-white placeholder-zinc-600 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500 transition-all text-sm"
            id="password"
            type="password"
            name="password"
            required
            minLength={6}
          />
        </div>

        <div
          className="flex h-6 items-end space-x-1"
          aria-live="polite"
          aria-atomic="true"
        >
          {errorMessage && (
            <p className="text-xs font-medium text-rose-400">{errorMessage}</p>
          )}
        </div>

        <button
          className="rounded-xl bg-cyan-600 px-4 py-3 text-white font-bold hover:bg-cyan-500 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 focus:ring-offset-zinc-900 disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_20px_rgba(6,182,212,0.3)] hover:shadow-[0_0_30px_rgba(6,182,212,0.5)]"
          aria-disabled={isPending}
          disabled={isPending}
        >
          {isPending ? "Ingresando..." : "Ingresar"}
        </button>
      </form>
    </div>
  );
}
