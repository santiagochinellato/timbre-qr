import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { checkUnitStatus } from "@/app/actions/check-status";
import { rejectCall } from "@/app/actions/reject-call";
import { sendResponse } from "@/app/actions/send-response";
import { DbAccessLog } from "@/lib/types";
import { useRealtime } from "@/components/providers/realtime-provider";

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

  // Consume Global Realtime Context
  const { lastEvent } = useRealtime();

  // Initial Fetch on Mount (to get state if we missed events before load)
  useEffect(() => {
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
  }, [unitId]);

  // React to Global Events
  useEffect(() => {
    if (!lastEvent) return;
    if (lastEvent.unitId !== unitId) return; // Ignore events for other units

    // Handle Event
    switch (lastEvent.type) {
        case "RINGING":
            router.refresh(); 
            // Optimistic Update
            // Note: payload has limited data, but enough for UI usually
            setActiveRing({
                id: lastEvent.payload?.logId as string,
                unitId: lastEvent.unitId,
                status: "ringing",
                visitorPhotoUrl: (lastEvent.payload?.photoUrl as string) || null,
                message: (lastEvent.payload?.message as string) || null,
                timestamp: new Date(lastEvent.timestamp),
                createdAt: new Date(lastEvent.timestamp),
                ringCount: 1, 
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
             break;
    }
  }, [lastEvent, unitId, router]);

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
