"use client";

import { useEffect } from "react";
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

export function PushManager() {
  useEffect(() => {
    if ("serviceWorker" in navigator && "PushManager" in window) {
      const registerServiceWorker = async () => {
        try {
          const registration = await navigator.serviceWorker.register("/sw.js");

          // Wait for the service worker to be ready
          await navigator.serviceWorker.ready;

          // Only subscribe if permission is already granted
          if (Notification.permission === "granted") {
            const subscription = await registration.pushManager.subscribe({
              userVisibleOnly: true,
              applicationServerKey: urlBase64ToUint8Array(
                process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
              ),
            });
            await subscribeUser(subscription.toJSON());
          }
        } catch (error) {
          console.error("Service Worker registration failed:", error);
        }
      };

      registerServiceWorker();
    }
  }, []);

  return null;
}
