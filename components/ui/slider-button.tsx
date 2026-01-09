"use client";

import React, { useState, useEffect } from "react";
import {
  motion,
  useMotionValue,
  useTransform,
  useAnimation,
} from "framer-motion";
import { ChevronRight, Unlock } from "lucide-react";

export const SlideToOpen = ({
  onUnlock,
  isLoading,
}: {
  onUnlock: () => void;
  isLoading?: boolean;
}) => {
  const [unlocked, setUnlocked] = useState(false);
  const x = useMotionValue(0);
  const controls = useAnimation();
  const maxDrag = 220;

  const opacity = useTransform(x, [0, maxDrag / 2], [1, 0]);
  const bgWidth = useTransform(x, [0, maxDrag], ["0%", "100%"]);

  const handleDragEnd = () => {
    if (x.get() > maxDrag * 0.7) {
      // If dragged more than 70%, snap to end and unlock
      setUnlocked(true);
      controls.start({ x: maxDrag });
      onUnlock();
    } else {
      // Otherwise reset
      controls.start({ x: 0 });
    }
  };

  useEffect(() => {
    if (isLoading) {
      setUnlocked(true);
      controls.start({ x: maxDrag });
    }
  }, [isLoading, controls]);

  return (
    <div
      className={`relative w-full h-16 rounded-full flex items-center p-1 overflow-hidden transition-colors duration-300 ${
        unlocked ? "bg-emerald-500/20" : "bg-zinc-900 border border-zinc-700"
      }`}
    >
      {/* Dynamic Background */}
      <motion.div
        className="absolute left-0 top-0 bottom-0 bg-emerald-500/20 z-0"
        style={{ width: bgWidth }}
      />

      {/* Label */}
      <motion.div
        style={{ opacity }}
        className="absolute w-full text-center z-0 pointer-events-none"
      >
        <span className="text-zinc-500 text-sm font-medium tracking-wide uppercase animate-pulse">
          {unlocked ? "Abriendo..." : "Deslizar para abrir"}
        </span>
      </motion.div>

      {/* Draggable Knob */}
      <motion.div
        drag={!unlocked ? "x" : false}
        dragConstraints={{ left: 0, right: maxDrag }}
        dragElastic={0.05}
        dragMomentum={false}
        onDragEnd={handleDragEnd}
        animate={controls}
        style={{ x }}
        className={`relative z-10 w-14 h-14 rounded-full flex items-center justify-center shadow-lg cursor-grab active:cursor-grabbing border ${
          unlocked
            ? "bg-emerald-500 border-emerald-400"
            : "bg-zinc-800 border-zinc-600 group hover:border-cyan-500/50"
        }`}
      >
        {unlocked ? (
          <Unlock className="w-6 h-6 text-white" />
        ) : (
          <ChevronRight className="w-6 h-6 text-zinc-400" />
        )}
      </motion.div>
    </div>
  );
};
