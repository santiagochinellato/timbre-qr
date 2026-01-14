"use client";

import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { Lock } from "lucide-react";

interface Unit {
  id: string;
  label: string;
  building: { name: string } | null;
}

export default function UnitSelector({
  units = [],
}: {
  units?: Unit[];
  image?: string;
  onReset?: () => void;
}) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const currentUnitId =
    searchParams.get("unitId") || (units.length > 0 ? units[0].id : "");

  const handleSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const params = new URLSearchParams(searchParams);
    params.set("unitId", e.target.value);
    router.replace(`${pathname}?${params.toString()}`);
  };

  return (
    <div className="mb-6 w-full max-w-md">
      <label className="text-zinc-400 text-xs font-bold uppercase tracking-wider mb-2 block">
        Seleccionar Dispositivo (Unidad)
      </label>
      <div className="relative">
        <select
          value={currentUnitId}
          onChange={handleSelect}
          className="w-full bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-white p-3 pr-10 rounded-lg appearance-none focus:ring-2 focus:ring-cyan-500 outline-none"
        >
          {units.map((u) => (
            <option key={u.id} value={u.id}>
              {u.building?.name} - {u.label}
            </option>
          ))}
        </select>
        <Lock className="absolute right-3 top-3.5 w-4 h-4 text-zinc-500 pointer-events-none" />
      </div>
      <p className="text-[10px] text-zinc-500 mt-2 text-center">
        Selecciona la unidad que deseas simular.
      </p>
    </div>
  );
}
