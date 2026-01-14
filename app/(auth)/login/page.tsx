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
        className="flex flex-col gap-5 rounded-2xl bg-bg-card backdrop-blur-md border border-border-subtle p-8 shadow-[0_4px_30px_rgba(0,0,0,0.1)] w-full max-w-sm"
      >
        <div className="flex justify-center mb-6">
          <Image
            src="/icons/isologoVertical.png"
            alt="Llegue"
            width={120}
            height={120}
            className="w-28 h-auto object-contain drop-shadow-[0_4px_6px_rgba(0,0,0,0.1)]"
          />
        </div>
        <h1 className="text-2xl font-bold text-center mb-6 text-text-main tracking-tight">
          Iniciar Sesión
        </h1>

        <div>
          <label className="block text-xs font-bold text-text-muted uppercase tracking-widest mb-1.5 ml-1">
            Email
          </label>
          <input
            className="block w-full rounded-xl bg-bg-app border border-border-subtle px-4 py-3 text-text-main placeholder-text-muted focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500 transition-all text-sm"
            id="email"
            type="email"
            name="email"
            placeholder="admin@example.com"
            required
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-text-muted uppercase tracking-widest mb-1.5 ml-1">
            Contraseña
          </label>
          <input
            className="block w-full rounded-xl bg-bg-app border border-border-subtle px-4 py-3 text-text-main placeholder-text-muted focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500 transition-all text-sm"
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
            <p className="text-xs font-medium text-status-alert">
              {errorMessage}
            </p>
          )}
        </div>

        <button
          className="rounded-xl bg-cyan-600 px-4 py-3 text-white font-bold hover:bg-cyan-500 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 focus:ring-offset-bg-app disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_4px_14px_rgba(6,182,212,0.3)] hover:shadow-[0_6px_20px_rgba(6,182,212,0.4)]"
          aria-disabled={isPending}
          disabled={isPending}
        >
          {isPending ? "Ingresando..." : "Ingresar"}
        </button>
      </form>
    </div>
  );
}
