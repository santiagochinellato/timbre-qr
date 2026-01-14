"use client";
import {
  useRef,
  useEffect,
  useState,
  useImperativeHandle,
  forwardRef,
} from "react";
import { AlertCircle, Loader2 } from "lucide-react";
// import { Button } from "@/components/ui/button"; // Removed as parent handles UI or internal button was unused in prompt logic mostly

export interface CameraHandle {
  capture: () => boolean;
}

interface CameraMirrorProps {
  onCapture: (image: string) => void;
  fullscreen?: boolean;
  defaultFacingMode?: "user" | "environment";
}

const CameraMirror = forwardRef<CameraHandle, CameraMirrorProps>(
  ({ onCapture, fullscreen, defaultFacingMode = "user" }, ref) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // Expose capture method
    useImperativeHandle(ref, () => ({
      capture: () => {
        if (videoRef.current && canvasRef.current) {
          const context = canvasRef.current.getContext("2d");
          if (context) {
            canvasRef.current.width = videoRef.current.videoWidth;
            canvasRef.current.height = videoRef.current.videoHeight;
            context.drawImage(videoRef.current, 0, 0);
            const data = canvasRef.current.toDataURL("image/webp", 0.7);
            onCapture(data);
            return true;
          }
        }
        return false;
      },
    }));

    useEffect(() => {
      let currentStream: MediaStream | null = null;
      let mounted = true;

      const startCamera = async () => {
        setIsLoading(true);
        setError(null);

        try {
          let stream: MediaStream;

          const getStream = async (mode: "user" | "environment") => {
            return await navigator.mediaDevices.getUserMedia({
              video: { facingMode: mode },
              audio: false,
            });
          };

          try {
            // Intento 1: Modo Preferido
            stream = await getStream(defaultFacingMode);
          } catch (err) {
            console.warn(
              `Preferred mode ${defaultFacingMode} failed, trying alternate...`,
              err
            );
            try {
              // Intento 2: Modo Alternativo
              const altMode =
                defaultFacingMode === "user" ? "environment" : "user";
              stream = await getStream(altMode);
            } catch (err2) {
              console.warn("Alternate mode failed, trying any video...", err2);
              // Intento 3: Cualquiera
              stream = await navigator.mediaDevices.getUserMedia({
                video: true,
                audio: false,
              });
            }
          }

          if (!mounted) {
            stream.getTracks().forEach((track) => track.stop());
            return;
          }

          currentStream = stream;

          if (videoRef.current) {
            videoRef.current.srcObject = stream;
            // Forzar play para navegadores perezosos
            await videoRef.current
              .play()
              .catch((e) => console.error("Play error", e));
          }
        } catch (err) {
          console.error("Fatal camera error:", err);
          if (mounted) {
            const errorName = (err as Error)?.name;
            setError(
              errorName === "NotAllowedError"
                ? "Permiso de cámara denegado. Por favor permite el acceso."
                : "No se pudo acceder a la cámara. Verifica que no esté en uso."
            );
          }
        } finally {
          if (mounted) setIsLoading(false);
        }
      };

      startCamera();

      // Cleanup estricto
      return () => {
        mounted = false;
        if (currentStream) {
          currentStream.getTracks().forEach((track) => track.stop());
        }
      };
    }, [defaultFacingMode]);

    if (error) {
      return (
        <div className="flex flex-col items-center justify-center w-full h-full min-h-[300px] bg-zinc-900 rounded-2xl border-2 border-dashed border-zinc-700 p-6 text-center">
          <AlertCircle className="w-10 h-10 text-red-500 mb-3" />
          <p className="text-zinc-400 font-medium">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-white text-black rounded-full text-sm font-bold hover:opacity-80 transition-opacity"
          >
            Reintentar
          </button>
        </div>
      );
    }

    return (
      <div
        className={`relative w-full h-full overflow-hidden bg-black ${
          !fullscreen &&
          "rounded-2xl shadow-xl aspect-[9/16] md:aspect-video ring-1 ring-white/10"
        }`}
      >
        {/* Loading Overlay */}
        {isLoading && (
          <div
            className={`absolute inset-0 z-20 flex flex-col items-center justify-center bg-zinc-900/80 backdrop-blur-sm ${
              !fullscreen && "rounded-2xl"
            }`}
          >
            <Loader2 className="w-8 h-8 text-white animate-spin mb-2" />
            <p className="text-white/70 text-sm font-medium">
              Iniciando cámara...
            </p>
          </div>
        )}

        {/* Video Element - Crucial Attributes */}
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="absolute inset-0 w-full h-full object-cover z-10"
          // Default styling - we can apply transform if needed but usually better handled by CSS or letting it be raw
          // style={{ transform: 'scaleX(-1)' }}
        />
        <canvas ref={canvasRef} className="hidden" />

        {/* Overlay UI from prompt (optional) */}
        {!isLoading && !error && (
          <div
            className={`absolute inset-0 z-30 pointer-events-none border-[1px] border-white/10 ${
              !fullscreen && "rounded-2xl"
            }`}
          >
            <div className="absolute top-4 right-4 bg-black/50 backdrop-blur-md px-3 py-1.5 rounded-full flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <span className="text-xs text-white/90 font-medium">En vivo</span>
            </div>
          </div>
        )}
      </div>
    );
  }
);

CameraMirror.displayName = "CameraMirror";
export default CameraMirror;
