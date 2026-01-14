"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, X } from "lucide-react";
import { subscribeUser } from "@/actions/push-actions";

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, "+")
    .replace(/_/g, "/");

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export function PushPermissionBanner() {
  const [isVisible, setIsVisible] = useState(false);
  const [permissionState, setPermissionState] =
    useState<NotificationPermission>("default");

  useEffect(() => {
    if (typeof window !== "undefined" && "Notification" in window) {
      setPermissionState(Notification.permission);
      // Show if permission is default (not granted yet)
      if (Notification.permission === "default") {
        // Delay slightly to not be intrusive immediately on load
        const timer = setTimeout(() => setIsVisible(true), 2000);
        return () => clearTimeout(timer);
      }
    }
  }, []);

  const handleAllow = async () => {
    try {
      if (!("serviceWorker" in navigator)) return;

      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(
          process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!
        ),
      });

      await subscribeUser(subscription.toJSON());
      setIsVisible(false);
      setPermissionState("granted");
    } catch (error) {
      console.error("Error asking for permission:", error);
    }
  };

  const handleDismiss = () => {
    setIsVisible(false);
  };

  if (permissionState === "granted" || permissionState === "denied")
    return null;

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 50 }}
          className="fixed bottom-20 left-4 right-4 z-40 bg-white/90 dark:bg-zinc-900/90 backdrop-blur-md border border-zinc-200 dark:border-zinc-800 p-4 rounded-xl shadow-2xl flex items-start gap-4"
        >
          <div className="p-2 bg-zinc-100 dark:bg-zinc-800 rounded-full shrink-0">
            <Bell className="w-5 h-5 text-cyan-500 dark:text-cyan-400" />
          </div>
          <div className="flex-1">
            <h4 className="text-text-main font-medium text-sm">
              Activar Notificaciones
            </h4>
            <p className="text-text-muted text-xs mt-1 leading-relaxed">
              Para saber cuándo tocan tu timbre, Gbellz necesita enviarte
              alertas.
            </p>
            <div className="flex gap-3 mt-3">
              <button
                onClick={handleAllow}
                className="bg-cyan-500 hover:bg-cyan-400 text-white dark:text-black text-xs font-bold px-4 py-2 rounded-full transition-colors"
              >
                Permitir
              </button>
              <button
                onClick={handleDismiss}
                className="text-text-muted hover:text-text-main text-xs font-medium px-2 py-2"
              >
                Ahora no
              </button>
            </div>
          </div>
          <button
            onClick={handleDismiss}
            className="text-text-muted hover:text-text-main"
          >
            <X className="w-4 h-4" />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
