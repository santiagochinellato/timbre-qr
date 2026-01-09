"use client";

import React, { useState } from "react";
import { motion, useMotionValue, useTransform } from "framer-motion";
import { ChevronRight, Lock, Unlock } from "lucide-react";

export const SlideToOpen = ({ onUnlock }: { onUnlock: () => void }) => {
  const [unlocked, setUnlocked] = useState(false);
  const x = useMotionValue(0);
  const maxDrag = 220; // Ancho máximo de deslizamiento

  // Transformaciones visuales basadas en el arrastre
  const opacity = useTransform(x, [0, maxDrag - 20], [1, 0]);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const bgGlow = useTransform(
    x,
    [0, maxDrag],
    ["rgba(6, 182, 212, 0)", "rgba(6, 182, 212, 0.4)"]
  );

  const handleDragEnd = () => {
    if (x.get() > maxDrag - 10) {
      setUnlocked(true);
      onUnlock();
    }
  };

  return (
    <motion.div
      style={{
        backgroundColor: "#18181b",
        boxShadow: "0 0 0 1px rgba(255,255,255,0.1)",
      }}
      className="relative w-full h-16 rounded-full flex items-center p-1 overflow-hidden"
    >
      {/* Fondo de Progreso (Glow Effect) */}
      <motion.div
        style={{ width: x, backgroundColor: "rgba(6, 182, 212, 0.2)" }}
        className="absolute left-0 h-full rounded-full blur-md"
      />

      {/* Texto de Instrucción */}
      <motion.div
        style={{ opacity }}
        className="absolute w-full text-center pointer-events-none"
      >
        <span className="text-zinc-500 text-sm font-medium tracking-wide font-sans uppercase">
          Deslizar para abrir
        </span>
      </motion.div>

      {/* El Knob Deslizante */}
      <motion.div
        drag="x"
        dragConstraints={{ left: 0, right: maxDrag }}
        dragElastic={0.05}
        dragMomentum={false}
        onDragEnd={handleDragEnd}
        style={{ x }}
        className="relative z-10 w-14 h-14 bg-zinc-900 rounded-full flex items-center justify-center border border-zinc-700 shadow-2xl cursor-grab active:cursor-grabbing group"
      >
        {unlocked ? (
          <Unlock className="w-6 h-6 text-emerald-400" />
        ) : (
          <div className="flex items-center justify-center">
            <ChevronRight className="w-6 h-6 text-cyan-400 animate-pulse" />
            {/* Efecto sutil de brillo interno */}
            <div className="absolute inset-0 rounded-full bg-cyan-500/10 opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
        )}
      </motion.div>
    </motion.div>
  );
};
