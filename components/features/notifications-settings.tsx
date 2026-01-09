"use client";

import { useEffect, useState, useTransition } from "react";
import { ArrowLeft, Bell, Mail } from "lucide-react";
import Link from "next/link";
import { toggleEmailDigest } from "@/app/actions/user-settings";
import { subscribeUser, sendPushNotification } from "@/actions/push-actions"; // Assuming this exists
import { toast } from "sonner";

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

export function NotificationsSettings({
  initialEmailDigest,
}: {
  initialEmailDigest: boolean;
}) {
  const [emailDigest, setEmailDigest] = useState(initialEmailDigest);
  const [pushEnabled, setPushEnabled] = useState(false);
  const [isPending, startTransition] = useTransition();

  // Check initial Push state
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.ready.then((registration) => {
        registration.pushManager.getSubscription().then((subscription) => {
          setPushEnabled(!!subscription);
        });
      });
    }
  }, []);

  const handleEmailToggle = async () => {
    const newState = !emailDigest;
    setEmailDigest(newState); // Optimistic
    startTransition(async () => {
      const res = await toggleEmailDigest(emailDigest);
      if (!res.success) {
        setEmailDigest(!newState); // Revert
        toast.error(res.message);
      } else {
        toast.success(res.message);
      }
    });
  };

  const handlePushToggle = async () => {
    if (pushEnabled) {
      // Unsubscribe
      // Ideally trigger server action to delete from DB too, but browser unsubscribe is Step 1
      // For now, simpler implementation: just browser unsubscribe
      /* Real impl: logic from PushPermissionBanner */
      toast.info(
        "Para desactivar, hazlo desde la configuración del navegador por ahora."
      );
      return;
    }

    // Subscribe
    try {
      const registration = await navigator.serviceWorker.ready;
      const sub = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(
          process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!
        ),
      });

      // Save to DB
      // Format similar to PushPermissionBanner
      const serializedSub = JSON.parse(JSON.stringify(sub));
      // Need to call subscribeUser server action
      await subscribeUser(serializedSub);
      setPushEnabled(true);
      toast.success("Notificaciones activadas");
    } catch (e) {
      console.error(e);
      toast.error("Error al activar notificaciones");
    }
  };

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link
          href="/dashboard/profile"
          className="p-2 rounded-full hover:bg-white/10 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-zinc-400" />
        </Link>
        <h1 className="text-xl font-bold text-white">Notificaciones</h1>
      </div>

      <div className="bg-zinc-900/50 backdrop-blur-md border border-white/10 rounded-2xl p-6 space-y-6">
        {/* PUSH TOGGLE */}
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-sm font-medium text-white flex items-center gap-2">
              <Bell className="w-4 h-4 text-cyan-400" />
              Push Notifications
            </span>
            <p className="text-xs text-zinc-500">
              Recibe alertas en tu dispositivo cuando toquen el timbre.
            </p>
          </div>
          <button
            onClick={handlePushToggle}
            className={`w-10 h-6 rounded-full border relative transition-all ${
              pushEnabled
                ? "bg-cyan-500/20 border-cyan-500/50"
                : "bg-zinc-800 border-white/10"
            }`}
          >
            <div
              className={`absolute top-1 w-4 h-4 rounded-full transition-all shadow-lg ${
                pushEnabled
                  ? "right-1 bg-cyan-400 shadow-cyan-400/50"
                  : "left-1 bg-zinc-600"
              }`}
            />
          </button>
        </div>

        {/* EMAIL DIGEST TOGGLE */}
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-sm font-medium text-white flex items-center gap-2">
              <Mail className="w-4 h-4 text-purple-400" />
              Email Digest
            </span>
            <p className="text-xs text-zinc-500">Resumen semanal de accesos.</p>
          </div>
          <button
            onClick={handleEmailToggle}
            disabled={isPending}
            className={`w-10 h-6 rounded-full border relative transition-all ${
              emailDigest
                ? "bg-purple-500/20 border-purple-500/50"
                : "bg-zinc-800 border-white/10"
            }`}
          >
            <div
              className={`absolute top-1 w-4 h-4 rounded-full transition-all shadow-lg ${
                emailDigest
                  ? "right-1 bg-purple-400 shadow-purple-400/50"
                  : "left-1 bg-zinc-600"
              }`}
            />
          </button>
        </div>
      </div>
    </div>
  );
}
