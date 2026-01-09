"use client";
import {
  useRef,
  useEffect,
  useState,
  useImperativeHandle,
  forwardRef,
} from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";

export interface CameraHandle {
  capture: () => void;
}

interface CameraMirrorProps {
  onCapture: (image: string) => void;
  fullscreen?: boolean;
}

const CameraMirror = forwardRef<CameraHandle, CameraMirrorProps>(
  ({ onCapture, fullscreen }, ref) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [stream, setStream] = useState<MediaStream | null>(null);
    const [error, setError] = useState<string | null>(null);

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
          }
        }
      },
    }));

    useEffect(() => {
      async function setupCamera() {
        try {
          const mediaStream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: "user" },
          });
          setStream(mediaStream);
          if (videoRef.current) {
            videoRef.current.srcObject = mediaStream;
          }
        } catch (err) {
          console.error("Camera access denied", err);
          setError("Allow camera access to verify identity.");
        }
      }
      setupCamera();

      return () => {
        stream?.getTracks().forEach((track) => track.stop());
      };
    }, []);

    const internalCapture = () => {
      if (videoRef.current && canvasRef.current) {
        const context = canvasRef.current.getContext("2d");
        if (context) {
          canvasRef.current.width = videoRef.current.videoWidth;
          canvasRef.current.height = videoRef.current.videoHeight;
          context.drawImage(videoRef.current, 0, 0);
          const data = canvasRef.current.toDataURL("image/webp", 0.7);
          onCapture(data);
        }
      }
    };

    if (error) {
      return (
        <div className="flex h-full w-full items-center justify-center p-6 text-center bg-neutral-900">
          <p className="text-alert font-medium">{error}</p>
        </div>
      );
    }

    // Loading Skeleton
    if (!stream) {
      return (
        <div
          className={`relative w-full h-full bg-neutral-800 animate-pulse overflow-hidden ${
            !fullscreen && "rounded-2xl aspect-[3/4]"
          }`}
        >
          <div className="absolute inset-0 flex items-center justify-center text-white/20">
            <svg
              className="w-16 h-16"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              strokeWidth="1.5"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6.827 6.175A2.31 2.31 0 0 1 5.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 0 0-1.134-.175 2.31 2.31 0 0 1-1.64-1.055l-.822-1.316a2.192 2.192 0 0 0-1.736-1.039 48.774 48.774 0 0 0-5.232 0 2.192 2.192 0 0 0-1.736 1.039l-.821 1.316Z"
              />
            </svg>
          </div>
        </div>
      );
    }

    return (
      <div
        className={`relative w-full h-full overflow-hidden bg-black ${
          !fullscreen && "rounded-2xl shadow-xl"
        }`}
      >
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="w-full h-full object-cover transform scale-x-[-1]"
        />
        <canvas ref={canvasRef} className="hidden" />

        {!fullscreen && (
          <div className="absolute bottom-6 left-0 right-0 flex justify-center z-10">
            <Button
              onClick={internalCapture}
              size="lg"
              className="rounded-full px-8 shadow-lg bg-white text-black hover:bg-gray-200"
            >
              Tomar Foto
            </Button>
          </div>
        )}

        {/* Internal "Timbre" Button if fullscreen and handled internally? 
          No, parent handles it for "Mobile Physiology". 
          But for now let's expose the captured method via ref or pass components in?
          Parent page needs to render the button. 
          So parent needs to call capture.
      */}
        {fullscreen && (
          <div className="absolute inset-x-0 bottom-0 p-6 pb-10 z-20 pointer-events-none">
            {/* This space is reserved for the parent UI overlay */}
          </div>
        )}
      </div>
    );
  }
);

CameraMirror.displayName = "CameraMirror";
export default CameraMirror;
