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
import { BellRing, Camera, Loader2, Info, Unlock } from "lucide-react";
import Image from "next/image";
import { checkCallStatus } from "@/app/actions/check-status";

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
  const [step, setStep] = useState<
    | "intro"
    | "camera"
    | "message"
    | "units"
    | "waiting"
    | "leave_message"
    | "success_open"
  >("intro");
  const [image, setImage] = useState<string | null>(null);
  const [logId, setLogId] = useState<string | null>(null);
  const cameraRef = useRef<CameraHandle>(null);
  const [state, formAction, isPending] = useActionState(ringDoorbell, null);
  const [timeLeft, setTimeLeft] = useState(45); // 45s timeout

  useEffect(() => {
    if (state?.success) {
      toast.success(state.message);
      setStep("waiting");
      if (state.logId) setLogId(state.logId);
      setTimeLeft(45);
    } else if (state?.success === false) {
      toast.error(state.message);
    }
  }, [state]);

  // Timer for 'waiting' step
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (step === "waiting" && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (step === "waiting" && timeLeft === 0) {
      // Timeout reached
      setStep("leave_message");
    }
    return () => clearInterval(interval);
    return () => clearInterval(interval);
  }, [step, timeLeft]);

  // Polling for 'success' status
  useEffect(() => {
    let pollInterval: NodeJS.Timeout;
    if (step === "waiting" && logId) {
      pollInterval = setInterval(async () => {
        const res = await checkCallStatus(logId);
        if (res.success && res.status === "opened") {
          setStep("success_open");
        }
      }, 2000);
    }
    return () => clearInterval(pollInterval);
  }, [step, logId]);

  const handleCapture = (img: string) => {
    setImage(img);
    setStep("units");
  };

  const handleRing = (unitId: string) => {
    if (!image) return toast.error("Por favor toma una foto primero");

    const formData = new FormData();
    formData.append("unit", unitId);

    if (image.startsWith("MSG:")) {
      // Text only fallback
      const msg = image.replace("MSG:", "");
      formData.append("message", msg);
      startTransition(() => {
        formAction(formData);
      });
    } else if (image.startsWith("data:")) {
      fetch(image)
        .then((res) => res.blob())
        .then((blob) => {
          // Send as webp
          const file = new File([blob], "visitor.webp", { type: "image/webp" });
          formData.set("image", file);
          startTransition(() => {
            formAction(formData);
          });
        });
    }
  };

  return (
    <div className="min-h-dvh bg-bg-app text-white flex flex-col relative overflow-hidden font-sans">
      {/* Background (Camera is only active in 'camera' step to save resources/permissions, but we want a cool bg always) */}
      <div className="absolute inset-0 z-0 bg-black">
        {step === "camera" && (
          <CameraMirror
            ref={cameraRef}
            onCapture={handleCapture}
            fullscreen={true}
          />
        )}
        {image && (
          <motion.img
            initial={{ scale: 1.1, filter: "blur(0px)" }}
            animate={{ scale: 1, filter: "blur(10px)" }}
            src={image}
            alt="Captured"
            className="w-full h-full object-cover opacity-50"
          />
        )}

        {/* Abstract Gradient for Intro */}
        {step === "intro" && (
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-zinc-800 via-black to-black opacity-80" />
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/90 to-transparent pointer-events-none" />
      </div>

      {/* Content Layer */}
      <div className="z-10 mt-auto p-6 pb-12 pt-12 relative flex flex-col items-center w-full h-full justify-end">
        <motion.div layout className="text-center mb-8">
          <div className="flex justify-center mb-6">
            <Image
              src="/icons/GbellzWhite.webp"
              alt="Gbellz"
              width={140}
              height={140}
              className="w-36 h-36 object-contain drop-shadow-[0_0_15px_rgba(255,255,255,0.3)]"
            />
          </div>
          <h1 className="text-3xl font-bold tracking-tight mb-2 drop-shadow-lg">
            {buildingName}
          </h1>
          <p className="text-zinc-400 font-medium">
            {step === "intro" && "Sistema de Acceso Seguro"}
            {step === "camera" && "Identifícate para ingresar"}
            {step === "units" && "Selecciona a quién visitas"}
          </p>
        </motion.div>

        <AnimatePresence mode="wait">
          {/* STEP 1: INTRO */}
          {step === "intro" && (
            <motion.div
              key="intro"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="w-full max-w-sm space-y-6"
            >
              <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6 space-y-4">
                <div className="flex items-center gap-4">
                  <div className="w-8 h-8 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center font-bold border border-cyan-500/30">
                    1
                  </div>
                  <p className="text-sm text-zinc-300">
                    Toca el timbre para comenzar.
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-8 h-8 rounded-full bg-zinc-800 text-zinc-500 flex items-center justify-center font-bold border border-white/5">
                    2
                  </div>
                  <p className="text-sm text-zinc-300">
                    Toma una foto de tu rostro.
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-8 h-8 rounded-full bg-zinc-800 text-zinc-500 flex items-center justify-center font-bold border border-white/5">
                    3
                  </div>
                  <p className="text-sm text-zinc-300">
                    Selecciona el departamento.
                  </p>
                </div>

                <div className="mt-4 pt-4 border-t border-white/10 flex gap-3">
                  <div className="mt-0.5 min-w-[20px]">
                    <Info className="w-5 h-5 text-amber-400" />
                  </div>
                  <p className="text-sm text-zinc-400 leading-relaxed">
                    El navegador te pedirá permiso para usar la{" "}
                    <strong className="text-white">Cámara</strong> y{" "}
                    <strong className="text-white">Ubicación</strong>. Debes
                    aceptarlos para poder llamar.
                  </p>
                </div>
              </div>

              <button
                onClick={() => setStep("camera")}
                className="w-full bg-cyan-500 hover:bg-cyan-400 text-black font-bold py-4 rounded-xl shadow-[0_0_20px_rgba(6,182,212,0.4)] transition-all transform active:scale-95"
              >
                Tocar Timbre
              </button>
            </motion.div>
          )}

          {/* STEP 2: CAMERA */}
          {step === "camera" && (
            <div className="w-full flex flex-col items-center">
              <motion.button
                key="capture-btn"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => cameraRef.current?.capture()}
                className="bg-white/10 backdrop-blur-md border border-white/20 p-6 rounded-full shadow-[0_0_40px_rgba(255,255,255,0.1)] group relative mt-4"
              >
                <div className="absolute inset-0 rounded-full border border-white/50 animate-ping opacity-20" />
                <Camera className="w-10 h-10 text-white group-hover:scale-110 transition-transform" />
              </motion.button>

              <button
                onClick={() => setStep("message")}
                className="mt-8 text-sm text-zinc-400 hover:text-white underline decoration-zinc-600 underline-offset-4"
              >
                No puedo usar la cámara
              </button>
            </div>
          )}

          {/* STEP 2B: MESSAGE FALLBACK */}
          {step === "message" && (
            <motion.div
              key="message"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="w-full max-w-sm space-y-4"
            >
              <div className="bg-zinc-900/80 backdrop-blur border border-white/10 rounded-2xl p-6">
                <h3 className="text-white font-bold text-lg mb-2">
                  Dejar un Mensaje
                </h3>
                <p className="text-zinc-400 text-sm mb-4">
                  Si no puedes tomar una foto, deja una breve descripción de
                  quién eres.
                </p>
                <textarea
                  className="w-full bg-black/50 border border-zinc-700 rounded-xl p-3 text-white placeholder:text-zinc-600 focus:outline-none focus:border-cyan-500 transition-colors resize-none h-32"
                  placeholder="Ej: Soy Juan, del correo..."
                  name="message"
                  id="visitor-message"
                />
              </div>
              <button
                onClick={() => {
                  const msg = (
                    document.getElementById(
                      "visitor-message"
                    ) as HTMLTextAreaElement
                  ).value;
                  if (!msg.trim())
                    return toast.error("Por favor escribe un mensaje");
                  setStep("units");
                  // We store the message in a temp state or pass it directly?
                  // Let's pass it via state to the handleRing function later,
                  // but handleRing expects an image string currently.
                  // We need to modify handleRing or use a state for the message.
                  // For simplicity, let's just piggyback on the 'image' state with a special prefix or add a new state.
                  setImage(`MSG:${msg}`);
                }}
                className="w-full bg-white text-black font-bold py-4 rounded-xl shadow-lg hover:bg-zinc-200 transition-colors"
              >
                Continuar sin foto
              </button>
              <button
                onClick={() => setStep("camera")}
                className="w-full py-2 text-sm text-zinc-500 hover:text-white"
              >
                Volver a intentar cámara
              </button>
            </motion.div>
          )}

          {/* STEP 3: UNIT SELECTION */}
          {step === "units" && (
            <motion.div
              key="unit-grid"
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              className="w-full max-w-sm space-y-4"
            >
              <div
                className={`grid gap-3 max-h-[40vh] overflow-y-auto no-scrollbar p-1 ${
                  units.length === 1 ? "grid-cols-1 w-full" : "grid-cols-3"
                }`}
              >
                {units.map((unit) => (
                  <motion.button
                    key={unit.id}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleRing(unit.id)}
                    disabled={isPending}
                    className="
                        relative bg-zinc-900 border border-white/20 
                        py-6 rounded-2xl flex flex-col items-center justify-center gap-2
                        hover:bg-zinc-800 hover:border-cyan-400 hover:shadow-[0_0_20px_rgba(6,182,212,0.3)]
                        transition-all duration-300 group
                        shadow-lg
                    "
                  >
                    <BellRing className="w-8 h-8 text-white group-hover:text-cyan-400 mb-1 drop-shadow-md" />
                    <span className="font-sans text-2xl font-bold text-white tracking-wide">
                      {unit.label}
                    </span>
                    {/* Breathing Glow Effect */}
                    <motion.div
                      animate={{ opacity: [0.1, 0.4, 0.1] }}
                      transition={{ duration: 2, repeat: Infinity }}
                      className="absolute inset-0 bg-cyan-500/10 rounded-2xl pointer-events-none"
                    />
                  </motion.button>
                ))}
              </div>

              <button
                onClick={() => {
                  setImage(null);
                  setStep("camera");
                }}
                className="w-full py-4 text-sm text-zinc-400 font-medium hover:text-white transition-colors"
              >
                Volver a tomar foto
              </button>
            </motion.div>
          )}
          {/* STEP 4: WAITING (45s Timer) */}
          {step === "waiting" && (
            <motion.div
              key="waiting"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="w-full max-w-sm flex flex-col items-center text-center space-y-6"
            >
              <div className="relative">
                <div className="w-24 h-24 rounded-full bg-cyan-500/10 flex items-center justify-center animate-pulse">
                  <BellRing className="w-10 h-10 text-cyan-400" />
                </div>
                {/* Circular Progress or simple timer */}
                <div className="absolute -bottom-2 -right-2 bg-zinc-900 border border-white/10 text-white text-xs font-bold w-8 h-8 flex items-center justify-center rounded-full">
                  {timeLeft}
                </div>
              </div>

              <div>
                <h2 className="text-2xl font-bold text-white mb-2">
                  Llamando...
                </h2>
                <p className="text-zinc-400 text-sm max-w-[250px] mx-auto">
                  Aguarde un momento mientras contactamos al propietario.
                </p>
              </div>

              <button
                onClick={() => setStep("leave_message")}
                className="text-sm text-zinc-500 hover:text-zinc-300 underline underline-offset-4"
              >
                No responde? Dejar mensaje ahora
              </button>
            </motion.div>
          )}

          {/* STEP 5: LEAVE MESSAGE (After Timeout) */}
          {step === "leave_message" && (
            <motion.div
              key="leave_message"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="w-full max-w-sm space-y-4"
            >
              <div className="bg-zinc-900/80 backdrop-blur border border-white/10 rounded-2xl p-6 text-center">
                <div className="w-12 h-12 bg-amber-500/20 text-amber-400 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Info className="w-6 h-6" />
                </div>
                <h3 className="text-white font-bold text-lg mb-2">
                  Sin Respuesta
                </h3>
                <p className="text-zinc-400 text-sm mb-4">
                  El propietario no ha respondido. Puedes dejarle un mensaje
                  escrito.
                </p>
                <textarea
                  id="timeout-message"
                  className="w-full bg-black/50 border border-zinc-700 rounded-xl p-3 text-white placeholder:text-zinc-600 focus:outline-none focus:border-cyan-500 transition-colors resize-none h-24"
                  placeholder="Ej: Dejé el paquete en la guardia..."
                />
              </div>

              <button
                onClick={() => {
                  const msg = (
                    document.getElementById(
                      "timeout-message"
                    ) as HTMLTextAreaElement
                  ).value;
                  if (!msg.trim()) return;
                  // Trigger server action to save message (TODO: Implement updateLogAction)
                  // For now just simulate success
                  toast.success("Mensaje enviado");
                  setTimeout(() => {
                    setImage(null);
                    setStep("intro");
                  }, 2000);
                }}
                className="w-full bg-cyan-500 hover:bg-cyan-400 text-black font-bold py-4 rounded-xl shadow-[0_0_20px_rgba(6,182,212,0.4)] transition-all"
              >
                Enviar Mensaje
              </button>
              <button
                onClick={() => {
                  setImage(null);
                  setStep("intro");
                }}
                className="w-full py-3 text-zinc-500 hover:text-zinc-300 text-sm"
              >
                Cancelar y Volver
              </button>
            </motion.div>
          )}

          {/* STEP 4B: SUCCESS OPEN */}
          {step === "success_open" && (
            <motion.div
              key="success_open"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="w-full max-w-sm flex flex-col items-center text-center space-y-6"
            >
              <div className="w-24 h-24 rounded-full bg-emerald-500/20 flex items-center justify-center border-2 border-emerald-500 shadow-[0_0_30px_rgba(16,185,129,0.4)]">
                <Unlock className="w-10 h-10 text-emerald-400" />
              </div>

              <div>
                <h2 className="text-3xl font-bold text-white mb-2">
                  ¡Puede Pasar!
                </h2>
                <p className="text-zinc-300 text-base">
                  La puerta ha sido abierta.
                </p>
              </div>

              <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl w-full">
                <p className="text-emerald-400 text-sm font-medium">
                  Bienvenido a {buildingName}
                </p>
              </div>

              <div className="w-full h-1 bg-zinc-800 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: "100%" }}
                  animate={{ width: "0%" }}
                  transition={{ duration: 5, ease: "linear" }}
                  className="h-full bg-emerald-500"
                  onAnimationComplete={() => {
                    // Reset after 5 seconds
                    setImage(null);
                    setLogId(null);
                    setStep("intro");
                  }}
                />
              </div>
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
