import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { checkUnitStatus } from "@/app/actions/check-status";
import { rejectCall } from "@/app/actions/reject-call";
import { sendResponse } from "@/app/actions/send-response";
import { DbAccessLog } from "@/lib/types";

export function useDoorbell(
  unitId: string,
  initialLog?: DbAccessLog | null
) {
  const router = useRouter();
  const [activeRing, setActiveRing] = useState<DbAccessLog | null | undefined>(
    initialLog?.status === "ringing" ? initialLog : null
  );
  
  const [rejecting, setRejecting] = useState(false);
  const [responding, setResponding] = useState(false);
  const [responseSent, setResponseSent] = useState(false);

  // SSE Effect
  useEffect(() => {
    // Initial fetch to get current state (in case we missed an event or just loaded)
    const fetchInitialStatus = async () => {
        try {
            const res = await checkUnitStatus(unitId);
            if (res.isRinging && res.log) {
                 setActiveRing(res.log as DbAccessLog);
            }
        } catch (e) {
            console.error("Initial status check failed", e);
        }
    };
    fetchInitialStatus();

    // Setup SSE
    const eventSource = new EventSource(`/api/stream?unitId=${unitId}`);
    
    eventSource.onopen = () => {
        console.log("🟢 SSE Connected");
    };

    eventSource.onmessage = (event) => {
        try {
            const data = JSON.parse(event.data);
            
            // Heartbeat check or connection msg
            if (data.type === "CONNECTED") return;

            console.log("📩 Event received:", data.type);

            switch (data.type) {
                case "RINGING":
                    router.refresh(); // Refresh server components if needed
                    // Fetch full log details if payload is partial, or just use payload if complete
                    // For safety, we can rely on checkStatus or constructing from payload
                    // Currently payload has partial data, so let's hit the server to be safe or optimize later.
                    // For speed: use payload. For reliability: fetch. 
                    // Let's optimistic update if possible, but payload only has IDs.
                    // Let's just set activeRing if we have enough data, or fetch.
                    // The payload has { logId, photoUrl, message }. Missing timestamp etc.
                    // We can reconstruct a temporary object.
                    setActiveRing({
                        id: data.payload.logId,
                        unitId: data.unitId,
                        status: "ringing",
                        visitorPhotoUrl: data.payload.photoUrl,
                        message: data.payload.message,
                        timestamp: new Date(data.timestamp),
                        createdAt: new Date(data.timestamp), // approximate
                        ringCount: 1, 
                        // Add other required fields with defaults
                        responseMessage: null,
                        answeredAt: null,
                        rejectedAt: null,
                        openedByUserId: null
                    } as unknown as DbAccessLog);
                    break;
                
                case "REJECTED":
                case "CALL_ENDED":
                case "DOOR_OPENED":
                     setActiveRing(null);
                     router.refresh();
                     break;

                case "RESPONSE_SENT":
                     router.refresh();
                     // Optionally update local state if we want to show the message immediately
                     break;
            }

        } catch (err) {
            console.error("Error parsing SSE", err);
        }
    };

    eventSource.onerror = (err) => {
        console.error("🔴 SSE Error", err);
        eventSource.close();
        // Native EventSource does not auto-reconnect if closed cleanly, but usually does on network error.
        // We can implement a manual retry if needed, but browser handles most network drops.
    };

    return () => {
        eventSource.close();
    };
  }, [unitId, router]);

  const handleReject = async () => {
    if (!activeRing) return;
    setRejecting(true);
    try {
      const res = await rejectCall(activeRing.id);
      if (res.success) {
        toast.success("Llamada rechazada");
        setActiveRing(null);
        router.refresh();
      } else {
        toast.error("Error al rechazar");
      }
    } catch {
      toast.error("Error de conexión");
    } finally {
      setRejecting(false);
    }
  };

  const handleSendResponse = async (msg: string) => {
    if (!activeRing) return;
    setResponding(true);
    try {
      const res = await sendResponse(activeRing.id, msg);
      if (res.success) {
        toast.success("Mensaje enviado");
        setResponseSent(true);
      } else {
        toast.error("Error al enviar mensaje");
      }
    } catch {
      toast.error("Error de conexión");
    } finally {
      setResponding(false);
    }
  };

  return {
    activeRing,
    rejecting,
    responding,
    responseSent,
    handleReject,
    handleSendResponse,
    resetResponseSent: () => setResponseSent(false),
  };
}
