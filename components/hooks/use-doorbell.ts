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

  // Polling Effect
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const res = await checkUnitStatus(unitId);

        if (res.isRinging && res.log) {
          if (!activeRing || activeRing.id !== res.log.id) {
            setActiveRing(res.log as DbAccessLog);
            router.refresh();
          }
        } else {
          if (activeRing) {
            setActiveRing(null);
            router.refresh();
          }
        }
      } catch (error) {
        console.error("Polling error:", error);
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [unitId, activeRing, router]);

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
