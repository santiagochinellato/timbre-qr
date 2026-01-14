"use client";
import { useRef, useState, lazy, Suspense } from "react";
import GeoGuard from "@/components/features/geo-guard";
import UnitSelector from "@/components/features/unit-selector";
import { motion, AnimatePresence } from "framer-motion";
import { CameraHandle } from "@/components/features/camera-mirror";

// Lazy load camera
const CameraMirror = lazy(() => import("@/components/features/camera-mirror"));

export default function Home() {
  const [image, setImage] = useState<string | null>(null);
  const cameraRef = useRef<CameraHandle>(null);

  const handleCapture = () => {
    cameraRef.current?.capture();
  };

  return (
    <GeoGuard>
      <main className="relative h-dvh w-full overflow-hidden bg-black text-text-main">
        {/* 1. Camera Layer (Full Background) */}
        <div className="absolute inset-0 z-0">
          <Suspense
            fallback={
              <div className="w-full h-full bg-neutral-900 animate-pulse" />
            }
          >
            <CameraMirror
              ref={cameraRef}
              onCapture={setImage}
              fullscreen={true}
            />
          </Suspense>
        </div>

        {/* 2. UI Layer (Overlay) */}
        <div className="absolute bottom-0 left-0 w-full z-10 px-6 pb-12 pt-40 bg-gradient-to-t from-bg-app/95 via-bg-app/70 to-transparent dark:from-black/90 dark:via-black/60">
          <AnimatePresence mode="wait">
            {!image ? (
              <motion.div
                key="intro"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-8"
              >
                <div className="space-y-1">
                  <h1 className="text-4xl font-semibold tracking-tighter text-text-main dark:text-white">
                    Bellz
                  </h1>
                  <p className="text-text-muted dark:text-white/80 font-medium text-lg">
                    Verifica tu identidad para entrar.
                  </p>
                </div>

                <button
                  onClick={handleCapture}
                  className="w-full bg-primary text-white h-16 rounded-full font-bold text-xl tracking-tight active:scale-95 transition-transform shadow-xl shadow-primary/20"
                >
                  Tomar Foto
                </button>
              </motion.div>
            ) : (
              <motion.div
                key="selector"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-bg-app dark:bg-zinc-900 text-text-main rounded-t-2xl -mx-6 -mb-safe p-6 pt-8 shadow-2xl space-y-6 border-t border-border-subtle"
              >
                <div className="flex items-center gap-4">
                  <div className="relative shrink-0">
                    <img
                      src={image}
                      alt="ID"
                      className="w-16 h-16 object-cover rounded-full border-2 border-bg-app dark:border-zinc-900 shadow-sm"
                    />
                    <div className="absolute bottom-0 right-0 w-4 h-4 bg-status-success rounded-full border-2 border-bg-app dark:border-zinc-900" />
                  </div>
                  <div>
                    <h2 className="font-semibold text-lg leading-tight text-text-main">
                      Identity Verified
                    </h2>
                    <p className="text-sm text-text-muted">
                      Select unit to ring
                    </p>
                  </div>
                </div>

                <UnitSelector image={image} onReset={() => setImage(null)} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>
    </GeoGuard>
  );
}
