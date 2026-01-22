"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useMemo,
  useCallback,
} from "react";
import { DoorbellEvent } from "@/lib/events";

interface RealtimeContextType {
  isConnected: boolean;
  lastEvent: DoorbellEvent | null;
  forceReconnect: () => void;
}

const RealtimeContext = createContext<RealtimeContextType | undefined>(
  undefined,
);

export function RealtimeProvider({ children }: { children: React.ReactNode }) {
  const [isConnected, setIsConnected] = useState(false);
  const [lastEvent, setLastEvent] = useState<DoorbellEvent | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [forceTrigger, setForceTrigger] = useState(0);

  const forceReconnect = useCallback(() => {
    setForceTrigger((prev) => prev + 1);
    setRetryCount(0);
  }, []);

  useEffect(() => {
    let eventSource: EventSource | null = null;
    let reconnectTimeout: NodeJS.Timeout;

    const connect = () => {
      // "Exponential" backoff capped at 30s
      const delay = Math.min(1000 * Math.pow(2, retryCount), 30000);

      reconnectTimeout = setTimeout(
        () => {
          console.log(
            `🔌 Connecting to Realtime Stream... (Attempt ${retryCount + 1})`,
          );

          eventSource = new EventSource("/api/stream");

          eventSource.onopen = () => {
            console.log("🟢 Realtime Stream Connected");
            setIsConnected(true);
            setRetryCount(0); // Reset retry on success
          };

          eventSource.onmessage = (event) => {
            try {
              const data = JSON.parse(event.data);
              if (data.type === "CONNECTED") return;
              if (data.type === "HEARTBEAT") return;

              console.log("⚡ Global Event Received:", data.type);
              setLastEvent(data);
            } catch (e) {
              console.error("Error parsing Global SSE:", e);
            }
          };

          eventSource.onerror = (err) => {
            console.error("🔴 Realtime Stream Error", err);
            setIsConnected(false);
            eventSource?.close();

            // Increment retry count for next attempt
            setRetryCount((prev) => prev + 1);
          };
        },
        retryCount === 0 ? 0 : delay,
      ); // Immediate first try
    };

    connect();

    return () => {
      console.log("🛑 Closing Realtime Connection");
      eventSource?.close();
      clearTimeout(reconnectTimeout);
    };
  }, [retryCount, forceTrigger]);

  const value = useMemo(
    () => ({
      isConnected,
      lastEvent,
      forceReconnect,
    }),
    [isConnected, lastEvent, forceReconnect],
  );

  return (
    <RealtimeContext.Provider value={value}>
      {children}
    </RealtimeContext.Provider>
  );
}

export function useRealtime() {
  const context = useContext(RealtimeContext);
  if (context === undefined) {
    throw new Error("useRealtime must be used within a RealtimeProvider");
  }
  return context;
}
