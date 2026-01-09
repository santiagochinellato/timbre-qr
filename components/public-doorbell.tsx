"use client";

import {
  useActionState,
  useEffect,
  startTransition,
  useState,
  useRef,
} from "react";
import { ringDoorbell } from "@/app/actions/ring-doorbell";
import { toast } from "sonner";
import { CameraHandle } from "@/components/features/camera-mirror";
import dynamic from "next/dynamic";
import { motion, AnimatePresence } from "framer-motion";
import { BellRing, Camera, Loader2 } from "lucide-react";
import Image from "next/image";

const CameraMirror = dynamic(
  () => import("@/components/features/camera-mirror"),
  { ssr: false }
);

export default function PublicDoorbell({
  buildingName,
  units,
}: {
  buildingName: string;
  units: { id: string; label: string }[];
}) {
  const [image, setImage] = useState<string | null>(null);
  const cameraRef = useRef<CameraHandle>(null);
  const [state, formAction, isPending] = useActionState(ringDoorbell, null);

  useEffect(() => {
    if (state?.success) {
      toast.success(state.message);
      // Wait slightly before resetting for better UX
      setTimeout(() => setImage(null), 2000);
    } else if (state?.success === false) {
      toast.error(state.message);
    }
  }, [state]);

  const handleRing = (unitId: string) => {
    if (!image) return toast.error("Por favor toma una foto primero");

    // Optimistic UI could happen here
    const formData = new FormData();
    formData.append("unit", unitId);

    if (image.startsWith("data:")) {
      fetch(image)
        .then((res) => res.blob())
        .then((blob) => {
          const file = new File([blob], "visitor.jpg", { type: "image/jpeg" });
          formData.set("image", file);
          startTransition(() => {
            formAction(formData);
          });
        });
    }
  };

  return (
    <div className="min-h-dvh bg-bg-app text-white flex flex-col relative overflow-hidden font-sans">
      {/* Camera Background Layer */}
      <div className="absolute inset-0 z-0">
        {!image ? (
          <CameraMirror
            ref={cameraRef}
            onCapture={setImage}
            fullscreen={true}
          />
        ) : (
          <motion.img
            initial={{ scale: 1.1, filter: "blur(0px)" }}
            animate={{ scale: 1, filter: "blur(10px)" }}
            transition={{ duration: 0.8 }}
            src={image}
            alt="Captured"
            className="w-full h-full object-cover opacity-50"
          />
        )}
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/80 to-transparent pointer-events-none" />
      </div>

      {/* Content Layer */}
      <div className="z-10 mt-auto p-6 pb-12 pt-24 relative flex flex-col items-center w-full">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <div className="flex justify-center mb-4">
            <Image
              src="/icons/GbellzWhite.webp"
              alt="Gbellz Logo"
              width={60}
              height={60}
              className="w-16 h-16 object-contain opacity-90 drop-shadow-md"
            />
          </div>
          <h1 className="text-4xl font-bold tracking-tight mb-2 drop-shadow-lg">
            {buildingName}
          </h1>
          <p className="text-zinc-300 font-medium drop-shadow-md">
            {image ? "Selecciona la unidad" : "Bienvenido. Identifícate."}
          </p>
        </motion.div>

        <AnimatePresence mode="wait">
          {!image ? (
            <motion.button
              key="capture-btn"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => cameraRef.current?.capture()}
              className="bg-white/10 backdrop-blur-md border border-white/20 p-6 rounded-full shadow-[0_0_40px_rgba(255,255,255,0.1)] group relative"
            >
              <div className="absolute inset-0 rounded-full border border-white/50 animate-ping opacity-20" />
              <Camera className="w-8 h-8 text-white group-hover:scale-110 transition-transform" />
            </motion.button>
          ) : (
            <motion.div
              key="unit-grid"
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              className="w-full max-w-sm space-y-4"
            >
              <div className="grid grid-cols-3 gap-3 max-h-[40vh] overflow-y-auto no-scrollbar p-1">
                {units.map((unit) => (
                  <motion.button
                    key={unit.id}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleRing(unit.id)}
                    disabled={isPending}
                    className="
                                            relative bg-zinc-900/60 backdrop-blur-xl border border-white/10 
                                            py-4 rounded-xl flex flex-col items-center justify-center gap-2
                                            hover:bg-zinc-800/80 hover:border-cyan-500/50 hover:shadow-[0_0_15px_rgba(6,182,212,0.2)]
                                            transition-all duration-300 group
                                        "
                  >
                    <BellRing className="w-5 h-5 text-zinc-500 group-hover:text-cyan-400 mb-1" />
                    <span className="font-mono text-lg font-bold text-zinc-200 group-hover:text-white">
                      {unit.label}
                    </span>
                    {/* Breathing Glow Effect */}
                    <motion.div
                      animate={{ opacity: [0.1, 0.3, 0.1] }}
                      transition={{ duration: 2, repeat: Infinity }}
                      className="absolute inset-0 bg-cyan-500/5 rounded-xl pointer-events-none"
                    />
                  </motion.button>
                ))}
              </div>

              <button
                onClick={() => setImage(null)}
                className="w-full py-4 text-sm text-zinc-400 font-medium hover:text-white transition-colors"
              >
                Volver a tomar foto
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Loading Overlay */}
      {isPending && (
        <div className="absolute inset-0 z-50 bg-black/80 flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="w-10 h-10 text-cyan-500 animate-spin" />
            <span className="text-cyan-500 font-medium tracking-widest uppercase text-sm animate-pulse">
              Llamando...
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
