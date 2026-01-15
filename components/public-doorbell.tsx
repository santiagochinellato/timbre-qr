"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Webcam from "react-webcam";
import {
  Bell,
  Check,
  Camera,
  MessageSquare,
  MapPin,
  Loader2,
  ShieldCheck,
  ChevronRight,
  X,
  Eye,
  Type,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
// Importamos tus acciones
import { ringDoorbell } from "@/app/actions/ring-doorbell";
import { getUnits } from "@/app/actions/get-units";
import { checkCallStatus } from "@/app/actions/check-status";

// --- TIPOS ---
type ViewState =
  | "landing"
  | "directory"
  | "action_mode"
  | "calling"
  | "success"
  | "no_answer"
  | "response_received";
type ActionMode = "photo" | "message";

interface Unit {
  id: string;
  name: string;
  description?: string;
}

interface PublicDoorbellProps {
  propertyId: string;
  propertyName: string;
  enableVisitorCamera?: boolean;
}

// --- VARIANTES DE ANIMACIÓN ---
const fadeVariants = {
  initial: { opacity: 0, scale: 0.98 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 1.02 },
  transition: { duration: 0.3, ease: "easeInOut" as const },
};

export default function PublicDoorbell({
  propertyId,
  propertyName,
  enableVisitorCamera = true,
}: PublicDoorbellProps) {
  // Estados Globales
  const [view, setView] = useState<ViewState>("landing");
  // Default to message if camera disabled, else photo
  const [actionMode, setActionMode] = useState<ActionMode>(
    enableVisitorCamera ? "photo" : "message"
  );
  const [isLoading, setIsLoading] = useState(true);

  // Datos
  const [units, setUnits] = useState<Unit[]>([]);
  const [selectedUnit, setSelectedUnit] = useState<Unit | null>(null);

  // Inputs
  const webcamRef = useRef<Webcam>(null);
  const [imgSrc, setImgSrc] = useState<string | null>(null);
  const [textMessage, setTextMessage] = useState("");
  const [cameraError, setCameraError] = useState(false);
  const [currentLogId, setCurrentLogId] = useState<string | null>(null);
  const [responseMessage, setResponseMessage] = useState<string | null>(null);

  // 1. Cargar Unidades
  useEffect(() => {
    const fetchUnits = async () => {
      try {
        const data = await getUnits(propertyId);
        setUnits(data);
      } catch (err) {
        console.error("Error cargando unidades", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchUnits();
  }, [propertyId]);

  // 1b. Polling de Estado de Llamada
  useEffect(() => {
    let interval: NodeJS.Timeout;
    let timeout: NodeJS.Timeout;

    const isPolling =
      (view === "calling" || view === "response_received") && currentLogId;

    if (isPolling) {
      // Polling cada 2 segundos
      interval = setInterval(async () => {
        try {
          const result = await checkCallStatus(currentLogId);
          if (result.success) {
            if (result.status === "opened") {
              setView("success");
            } else if (result.status === "rejected") {
              setView("no_answer");
            } else if (result.responseMessage) {
              // New Message Received
              setResponseMessage(result.responseMessage);
              setView("response_received");
            }
          }
        } catch (error) {
          console.error("Error polling status:", error);
        }
      }, 2000);

      // Timeout de 60 segundos (si nadie responde ni manda mensaje)
      timeout = setTimeout(() => {
        setView("no_answer");
      }, 60000);
    }

    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, [view, currentLogId]);

  // 2. Manejo de Permisos (Reales)
  const requestPermissions = async () => {
    try {
      // 1. Pedir Cámara (Solo si está habilitada)
      if (enableVisitorCamera) {
        await navigator.mediaDevices.getUserMedia({ video: true });
      }

      // 2. Pedir Ubicación (No bloqueante / Opcional)
      if ("geolocation" in navigator) {
        navigator.geolocation.getCurrentPosition(
          (pos) => console.log("Ubicación permitida:", pos.coords),
          (err) => console.warn("Ubicación no permitida o error:", err)
        );
      }

      // Si todo OK, avanzamos
      setView("directory");
    } catch (err) {
      console.error("Permisos de cámara denegados", err);
      // Aún así permitimos entrar, pero la cámara mostrará el fallback de error
      setView("directory");
    }
  };

  // 3. Selección de Unidad
  const handleUnitSelect = (unit: Unit) => {
    setSelectedUnit(unit);
    setImgSrc(null);
    setTextMessage("");
    setCameraError(false);
    setActionMode(enableVisitorCamera ? "photo" : "message");
    setView("action_mode");
  };

  // 4. Capturar Foto
  const capture = useCallback(() => {
    if (webcamRef.current) {
      const imageSrc = webcamRef.current.getScreenshot();
      setImgSrc(imageSrc);
    }
  }, [webcamRef]);

  // 5. Enviar (Timbrar)
  const handleRing = async () => {
    if (!selectedUnit) return;
    setView("calling");

    try {
      const formData = new FormData();
      formData.append("unit", selectedUnit.id);

      if (actionMode === "photo" && imgSrc) {
        formData.append("message", "🔔 Visita con Foto");
        const fetchResponse = await fetch(imgSrc);
        const blob = await fetchResponse.blob();
        const file = new File([blob], "visitor_photo.jpg", {
          type: "image/jpeg",
        });
        formData.append("image", file);
      } else {
        const msg = textMessage.trim() || "🔔 Visita (Sin mensaje)";
        formData.append("message", msg);
      }

      const response = await ringDoorbell(null, formData);
      if (response?.logId) {
        setCurrentLogId(response.logId);
      }
      // Removed automatic success timeout
      // setTimeout(() => setView("success"), 2000);
    } catch (error) {
      console.error("Error al timbrar", error);
      setView("directory");
    }
  };

  // --- COMPONENTES UI ---

  const Header = ({ small = false }: { small?: boolean }) => (
    <div
      className={cn(
        "flex flex-col items-center justify-center space-y-4 text-center z-20",
        small ? "py-4" : "py-10"
      )}
    >
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className={cn(
          "relative bg-white dark:bg-zinc-900 rounded-2xl flex items-center justify-center shadow-2xl shadow-cyan-500/10 dark:shadow-cyan-900/20 border border-zinc-100 dark:border-zinc-800",
          small ? "w-12 h-12 rounded-xl" : "w-16 h-16"
        )}
      >
        <img
          src="/icons/isologoVertical.png"
          alt="Logo"
          className={cn("object-contain", small ? "w-8 h-8" : "w-12 h-12")}
        />
      </motion.div>
      {!small && (
        <div className="space-y-2">
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-white">
            {propertyName}
          </h1>
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-white font-sans overflow-hidden flex flex-col transition-colors duration-300">
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-[20%] -left-[10%] w-[70%] h-[70%] bg-cyan-200/30 dark:bg-cyan-900/20 rounded-full blur-[120px]" />
        <div className="absolute top-[40%] -right-[10%] w-[60%] h-[60%] bg-sky-200/30 dark:bg-sky-900/20 rounded-full blur-[100px]" />
      </div>

      <AnimatePresence mode="wait">
        {/* === VISTA 0: LANDING === */}
        {view === "landing" && (
          <motion.div
            key="landing"
            {...fadeVariants}
            className="relative z-10 flex-1 flex flex-col items-center justify-center p-8 max-w-md mx-auto text-center"
          >
            <Header />
            <div className="bg-white/50 dark:bg-zinc-900/50 backdrop-blur-xl border border-zinc-200 dark:border-zinc-800 p-8 rounded-3xl w-full space-y-6 shadow-xl">
              <div className="flex justify-center gap-4 text-cyan-600 dark:text-cyan-400">
                {enableVisitorCamera && (
                  <div className="p-3 bg-cyan-100 dark:bg-cyan-900/30 rounded-full">
                    <Camera size={28} />
                  </div>
                )}
                <div className="p-3 bg-cyan-100 dark:bg-cyan-900/30 rounded-full">
                  <MapPin size={28} />
                </div>
              </div>
              <div className="space-y-2">
                <h2 className="text-lg font-semibold">Antes de empezar</h2>
                <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
                  Para tu seguridad y la del edificio, esta aplicación necesita
                  acceso temporal a tu {enableVisitorCamera && <b>cámara y </b>}{" "}
                  <b>ubicación</b>.
                </p>
              </div>
              <Button
                onClick={requestPermissions}
                className="w-full h-12 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white font-medium shadow-lg shadow-cyan-500/20"
              >
                Permitir y Continuar
              </Button>
              <p className="text-[10px] text-zinc-400 uppercase tracking-widest pt-2">
                <ShieldCheck className="w-3 h-3 inline mr-1" /> Privacidad
                Protegida
              </p>
            </div>
          </motion.div>
        )}

        {/* ... (Directory View is same) ... */}
        {view === "directory" && (
          // ... copy existing Directory View ...
          // (Using existing code structure, simpler to leave this big block alone if not changing logic)
          <motion.div
            key="directory"
            {...fadeVariants}
            className="relative z-10 flex-1 flex flex-col px-6 max-w-lg mx-auto w-full h-full"
          >
            <Header />
            <div className="flex-1 flex flex-col min-h-0">
              <div className="flex items-center justify-between mb-4 px-2">
                <span className="text-sm font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                  Selecciona Unidad
                </span>
                <span className="inline-flex items-center px-2 py-1 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 text-[10px] font-bold">
                  <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full mr-1.5 animate-pulse" />
                  ONLINE
                </span>
              </div>
              {isLoading ? (
                <div className="flex-1 flex justify-center items-center">
                  <Loader2 className="animate-spin text-cyan-500 w-8 h-8" />
                </div>
              ) : (
                <div className="flex-1 overflow-y-auto pb-8 no-scrollbar mask-image-gradient">
                  <div className="grid grid-cols-2 gap-3">
                    {units.map((unit, i) => (
                      <motion.button
                        key={unit.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.05 }}
                        whileTap={{ scale: 0.96 }}
                        onClick={() => handleUnitSelect(unit)}
                        className="group relative flex flex-col p-5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-sm hover:shadow-md hover:border-cyan-500/30 dark:hover:border-cyan-500/50 transition-all text-left overflow-hidden"
                      >
                        <div className="absolute right-0 top-0 p-3 opacity-0 group-hover:opacity-100 transition-opacity -mr-1 -mt-1">
                          <div className="bg-cyan-100 dark:bg-cyan-900/50 p-1.5 rounded-full">
                            <ChevronRight
                              size={14}
                              className="text-cyan-600 dark:text-cyan-300"
                            />
                          </div>
                        </div>
                        <div className="w-8 h-8 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center mb-3 group-hover:bg-cyan-100 dark:group-hover:bg-cyan-900/30 transition-colors">
                          <Bell
                            size={16}
                            className="text-zinc-500 dark:text-zinc-400 group-hover:text-cyan-600 dark:group-hover:text-cyan-300"
                          />
                        </div>
                        <span className="text-lg font-bold text-zinc-800 dark:text-zinc-100 leading-tight">
                          {unit.name}
                        </span>
                        <span className="text-xs text-zinc-500 mt-1 font-medium">
                          Tocar para avisar
                        </span>
                      </motion.button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* === VISTA 2: MODO ACCIÓN (REDDISEÑADO) === */}
        {view === "action_mode" && (
          <motion.div
            key="action_mode"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed inset-0 z-50 bg-zinc-950 flex flex-col"
          >
            {/* Top Bar */}
            <div className="absolute top-0 w-full z-20 p-4 flex items-center justify-between bg-gradient-to-b from-black/80 to-transparent pointer-events-none">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setView("directory")}
                className="pointer-events-auto bg-black/40 text-white hover:bg-black/60 backdrop-blur-md rounded-full w-10 h-10 border border-white/10"
              >
                <X size={20} />
              </Button>
              <div className="px-4 py-1.5 bg-black/40 backdrop-blur-md rounded-full border border-white/10">
                <span className="text-xs font-medium text-white/90">
                  Visitando a {selectedUnit?.name}
                </span>
              </div>
              <div className="w-10" />
            </div>

            {/* Content Area */}
            <div className="flex-1 relative overflow-hidden bg-black">
              {/* --- MODO FOTO --- */}
              <div
                className={cn(
                  "absolute inset-0 transition-opacity duration-500 ease-in-out",
                  actionMode === "photo" && enableVisitorCamera
                    ? "opacity-100 z-10"
                    : "opacity-0 pointer-events-none"
                )}
              >
                {/* ... (Camera Content) ... */}
                {imgSrc ? (
                  // Preview
                  <div className="relative w-full h-full">
                    <img
                      src={imgSrc}
                      className="w-full h-full object-cover"
                      alt="Preview"
                    />
                    <div className="absolute inset-0 bg-black/20" />
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none">
                      <div className="w-16 h-16 bg-emerald-500/20 backdrop-blur-md rounded-full flex items-center justify-center mx-auto mb-2 ring-1 ring-emerald-500/50">
                        <Check className="text-emerald-400 w-8 h-8" />
                      </div>
                      <p className="text-white font-medium text-shadow">
                        Foto Capturada
                      </p>
                    </div>
                  </div>
                ) : (
                  // Live Camera
                  <div className="relative w-full h-full">
                    {!cameraError ? (
                      <Webcam
                        ref={webcamRef}
                        audio={false}
                        screenshotFormat="image/jpeg"
                        videoConstraints={{ facingMode: "user" }}
                        onUserMediaError={() => setCameraError(true)}
                        className="w-full h-full object-cover"
                        mirrored={true}
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center bg-zinc-900 text-zinc-400">
                        <Camera size={48} className="mb-4 opacity-50" />
                        <p>Cámara no disponible</p>
                      </div>
                    )}
                    {/* Guía Visual */}
                    <div className="absolute bottom-40 left-0 right-0 text-center pointer-events-none">
                      <p className="inline-block px-4 py-1.5 rounded-full bg-black/30 backdrop-blur-sm text-white/80 text-xs font-medium border border-white/10">
                        Encuadra tu rostro para seguridad
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* --- MODO TEXTO --- */}
              <div
                className={cn(
                  "absolute inset-0 bg-zinc-900 flex flex-col pt-24 px-6 transition-all duration-500",
                  actionMode === "message"
                    ? "opacity-100 z-10 translate-y-0"
                    : "opacity-0 translate-y-10 pointer-events-none"
                )}
              >
                <div className="flex-1 max-w-md mx-auto w-full">
                  <div className="mb-6 flex items-center gap-3 opacity-80">
                    <div className="p-2 bg-cyan-500/20 rounded-lg">
                      <MessageSquare className="text-cyan-400 w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-white">
                        Dejar Mensaje
                      </h3>
                      <p className="text-xs text-zinc-400">
                        Se enviará como notificación de texto
                      </p>
                    </div>
                  </div>

                  <textarea
                    value={textMessage}
                    onChange={(e) => setTextMessage(e.target.value)}
                    placeholder={`Hola, soy una visita para ${selectedUnit?.name}...`}
                    className="w-full bg-zinc-800/50 border border-zinc-700 rounded-2xl p-5 text-lg text-white placeholder:text-zinc-500 focus:ring-2 focus:ring-cyan-500 focus:border-transparent min-h-[150px] resize-none mb-4"
                  />

                  <div className="flex flex-wrap gap-2">
                    {[
                      "📦 Paquete",
                      "🍕 Delivery",
                      "👋 Amigo/a",
                      "🔧 Servicio",
                    ].map((tag) => (
                      <button
                        key={tag}
                        onClick={() =>
                          setTextMessage((prev) => `${prev} ${tag}`.trim())
                        }
                        className="px-3 py-1.5 bg-zinc-800 rounded-lg text-xs text-zinc-300 hover:bg-zinc-700 border border-zinc-700 transition-colors"
                      >
                        {tag}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* --- PANEL DE CONTROL INFERIOR (REDDISEÑADO) --- */}
            <div className="relative z-30 bg-zinc-900 border-t border-zinc-800 p-6 pb-8 space-y-6 rounded-t-3xl shadow-[0_-10px_40px_rgba(0,0,0,0.5)]">
              {/* 1. Selector de Modo (Tabs Descriptivos) */}

              {/* ONLY SHOW TABS IF VISITOR CAMERA ENABLED */}
              {enableVisitorCamera && !imgSrc && (
                <div className="grid grid-cols-2 gap-3 p-1 bg-zinc-950/50 rounded-2xl border border-white/5">
                  <button
                    onClick={() => setActionMode("photo")}
                    className={cn(
                      "flex flex-col items-center justify-center py-3 px-2 rounded-xl transition-all duration-300",
                      actionMode === "photo"
                        ? "bg-zinc-800 text-white shadow-md ring-1 ring-white/10"
                        : "text-zinc-500 hover:text-zinc-300 hover:bg-white/5"
                    )}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <Eye size={18} className="text-cyan-400" />
                      <span className="font-semibold text-sm">Foto</span>
                    </div>
                    <span className="text-[10px] opacity-60">
                      Verificación Visual
                    </span>
                  </button>

                  <button
                    onClick={() => setActionMode("message")}
                    className={cn(
                      "flex flex-col items-center justify-center py-3 px-2 rounded-xl transition-all duration-300",
                      actionMode === "message"
                        ? "bg-zinc-800 text-white shadow-md ring-1 ring-white/10"
                        : "text-zinc-500 hover:text-zinc-300 hover:bg-white/5"
                    )}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <Type size={18} className="text-violet-400" />
                      <span className="font-semibold text-sm">Texto</span>
                    </div>
                    <span className="text-[10px] opacity-60">
                      Mensaje Privado
                    </span>
                  </button>
                </div>
              )}

              {/* 2. Botón de Acción Principal */}
              <div className="flex gap-3">
                {/* Botón "Repetir" solo si hay foto tomada */}
                {actionMode === "photo" && imgSrc && (
                  <Button
                    variant="outline"
                    onClick={() => setImgSrc(null)}
                    className="h-14 w-14 rounded-xl border-zinc-700 bg-transparent text-zinc-400 hover:text-white hover:bg-zinc-800 shrink-0"
                  >
                    <Loader2 className="w-5 h-5" />{" "}
                    {/* Icono de refrescar/repetir */}
                  </Button>
                )}

                {/* Botón Principal Dinámico */}
                {actionMode === "photo" && !imgSrc && enableVisitorCamera ? (
                  <Button
                    onClick={capture}
                    className="w-full h-14 bg-white text-black hover:bg-zinc-200 rounded-xl text-lg font-bold shadow-lg shadow-white/10"
                  >
                    <Camera className="mr-2 w-5 h-5" /> Capturar Foto
                  </Button>
                ) : (
                  <Button
                    onClick={handleRing}
                    disabled={actionMode === "message" && !textMessage.trim()}
                    className={cn(
                      "w-full h-14 rounded-xl text-lg font-bold shadow-lg transition-all",
                      actionMode === "photo"
                        ? "bg-cyan-600 hover:bg-cyan-500 text-white shadow-cyan-900/20"
                        : "bg-violet-600 hover:bg-violet-500 text-white shadow-violet-900/20"
                    )}
                  >
                    <Bell className="mr-2 w-5 h-5" />
                    {actionMode === "photo"
                      ? "Timbrar con Foto"
                      : "Timbrar (Enviar)"}
                  </Button>
                )}
              </div>
            </div>
          </motion.div>
        )}

        {/* === VISTA 3: CALLING === */}
        {view === "calling" && (
          <motion.div
            key="calling"
            {...fadeVariants}
            className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-zinc-950 px-6"
          >
            <div className="absolute inset-0 flex items-center justify-center overflow-hidden pointer-events-none">
              <motion.div
                animate={{ scale: [1, 2.5], opacity: [0.3, 0] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeOut" }}
                className="absolute w-64 h-64 bg-cyan-600/20 rounded-full blur-2xl"
              />
              <motion.div
                animate={{ scale: [1, 1.5], opacity: [0.5, 0] }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeOut",
                  delay: 0.5,
                }}
                className="absolute w-40 h-40 border border-cyan-500/30 rounded-full"
              />
            </div>
            <div className="relative z-10 text-center space-y-6">
              <motion.div
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                className="w-32 h-32 rounded-full overflow-hidden border-4 border-cyan-500 shadow-[0_0_40px_-5px_rgba(6,182,212,0.6)] mx-auto relative bg-zinc-900"
              >
                {actionMode === "photo" && imgSrc ? (
                  <img src={imgSrc} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-violet-600 to-indigo-700">
                    <MessageSquare className="w-12 h-12 text-white/90" />
                  </div>
                )}
              </motion.div>
              <div>
                <h2 className="text-3xl font-bold text-white mb-2 tracking-tight">
                  Llamando...
                </h2>
                <p className="text-cyan-200/80">
                  Notificando a{" "}
                  <span className="text-white font-semibold">
                    {selectedUnit?.name}
                  </span>
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {/* === VISTA 6: RESPUESTA RECIBIDA === */}
        {view === "response_received" && (
          <motion.div
            key="response_received"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-zinc-950 px-6 text-center"
          >
            <div className="w-24 h-24 bg-cyan-900/30 rounded-full flex items-center justify-center mb-6 border border-cyan-500/30 animate-pulse">
              <MessageSquare className="w-10 h-10 text-cyan-400" />
            </div>
            <h2 className="text-xl font-bold text-gray-400 mb-2 uppercase tracking-wide">
              Mensaje del Residente
            </h2>
            <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-2xl max-w-sm w-full shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 left-0 w-1 h-full bg-cyan-500" />
              <p className="text-white text-2xl font-serif italic leading-relaxed">
                &quot;{responseMessage}&quot;
              </p>
            </div>

            <p className="text-zinc-500 mt-8 text-sm max-w-xs">
              Por favor espere o siga las instrucciones.
            </p>

            <Button
              onClick={() => {
                setView("directory");
                setSelectedUnit(null);
                setImgSrc(null);
                setResponseMessage(null);
                setCurrentLogId(null); // Stop polling
              }}
              variant="outline"
              className="mt-8 border-zinc-700 text-zinc-300 hover:bg-zinc-800 w-full max-w-xs h-12"
            >
              Volver al Inicio
            </Button>
          </motion.div>
        )}

        {/* === VISTA 4: ÉXITO === */}
        {view === "success" && (
          <motion.div
            key="success"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-emerald-500 dark:bg-emerald-600 text-white px-6 text-center"
          >
            <motion.div
              initial={{ scale: 0, rotate: -45 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: "spring", stiffness: 200 }}
              className="w-24 h-24 bg-white rounded-full flex items-center justify-center mb-6 shadow-2xl"
            >
              <Check className="w-12 h-12 text-emerald-600" strokeWidth={4} />
            </motion.div>
            <h2 className="text-4xl font-bold mb-2">¡Pase!</h2>
            <p className="text-emerald-100 text-lg max-w-xs mx-auto leading-relaxed">
              La puerta ha sido abierta.
            </p>
            <Button
              onClick={() => {
                setView("directory");
                setSelectedUnit(null);
                setImgSrc(null);
              }}
              className="mt-12 bg-white text-emerald-700 hover:bg-emerald-50 rounded-full px-10 py-6 text-lg font-bold shadow-xl transition-transform active:scale-95"
            >
              Volver al Inicio
            </Button>
          </motion.div>
        )}
        {/* === VISTA 5: NO RESPUESTA === */}
        {view === "no_answer" && (
          <motion.div
            key="no_answer"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-zinc-950 px-6 text-center"
          >
            <div className="w-24 h-24 bg-zinc-900 rounded-full flex items-center justify-center mb-6 border border-zinc-800">
              <Bell className="w-10 h-10 text-zinc-500" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">
              No hubo respuesta
            </h2>
            <p className="text-zinc-400 mb-10 max-w-xs">
              El residente no ha atendido tu llamado. ¿Qué deseas hacer?
            </p>

            <div className="flex flex-col gap-3 w-full max-w-xs">
              <Button
                onClick={() => {
                  setView("calling"); // Reintentar (resets layout but logic needs new logId usually... actually polling just continues if we don't clear logId... wait, polling depends on 'view'. If we go back to 'calling', polling restarts with SAME logId. Ideally we should create a NEW log.
                  // To keep it simple for MVP: Let's assume 'Reintentar' means Ring Again.
                  handleRing();
                }}
                className="w-full h-12 bg-white text-black hover:bg-zinc-200"
              >
                Volver a Timbrar
              </Button>
              <Button
                onClick={() => {
                  setActionMode("message");
                  setView("action_mode");
                }}
                variant="outline"
                className="w-full h-12 border-zinc-700 text-zinc-300 hover:bg-zinc-800"
              >
                Dejar un Mensaje
              </Button>
              <Button
                onClick={() => {
                  setView("directory");
                  setSelectedUnit(null);
                  setImgSrc(null);
                }}
                variant="ghost"
                className="w-full h-12 text-zinc-500 hover:text-white"
              >
                Volver al Inicio
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
