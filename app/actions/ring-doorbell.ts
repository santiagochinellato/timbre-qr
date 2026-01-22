"use server";

import { db } from "@/db";
import { accessLogs, userUnits } from "@/db/schema";
import { eq } from "drizzle-orm";
import { sendPushNotification } from "@/actions/push-actions";
import { RingDoorbellSchema } from "@/lib/validations";
// import { uploadVisitorSelfie } from '@/lib/storage/upload'; 

/**
 * Handles the "Ring Doorbell" action from the visitor page.
 * Validates inputs, handles image uploads, rate limits, creates logs, and sends push notifications.
 * @param prevState Previous form state (unused)
 * @param formData FormData containing 'unitId', 'message', and optional 'image'
 */
export async function ringDoorbell(prevState: unknown, formData: FormData) {
  // 1. Extract & Validate Input
  const rawData = {
    unitId: (formData.get("slug") || formData.get("unit")) as string,
    message: (formData.get("message") as string) || undefined,
  };

  const validation = RingDoorbellSchema.safeParse(rawData);

  if (!validation.success) {
    return { success: false, message: "Datos inválidos", error: validation.error.format() };
  }

  const { unitId, message } = validation.data;
  const imageEntry = formData.get("image");
  let photoUrl: string | null = null;

  // 2. Handle Image Upload
  if (imageEntry instanceof File && imageEntry.size > 0) {
    try {
      const { uploadFile } = await import("@/lib/storage");
      photoUrl = await uploadFile(imageEntry);
    } catch (error) {
      console.error("❌ Failed to save image:", error);
      // We continue even if image fails, just logging it
    }
  }

  try {
    const unitResult = await db.query.units.findFirst({
        where: (u, { eq }) => eq(u.id, unitId)
    });
    
    if (!unitResult) {
        return { success: false, message: "Unit not found" };
    }

    // 3. Anti-Spam / Rate Limiting
    const { checkRateLimit } = await import("@/lib/rate-limit");
    const limitResult = await checkRateLimit(unitId, 5, 60);

    if (!limitResult.success) {
         return { success: false, message: "Espere un momento antes de volver a llamar." };
    }

    // 4. Insert Log
    const [newLog] = await db
        .insert(accessLogs)
        .values({
            unitId: unitId,
            visitorPhotoUrl: photoUrl,
            message: message || null,
            status: "ringing",
        })
        .returning();

    // 5. Find Associated Users
    const associatedUsers = await db
        .select({ userId: userUnits.userId })
        .from(userUnits)
        .where(eq(userUnits.unitId, unitId));

    if (associatedUsers.length === 0) {
        return { success: true, message: "Timbre tocado (Sin residentes activos)", logId: newLog.id };
    }

    // 6. Build & Send Notifications
    const title = !photoUrl ? "⚠️ Alerta: Timbre sin cámara" : "Timbre Tocado";
    const body = !photoUrl 
        ? (message ? `Mensaje: "${message}"` : "Alguien tocó el timbre (sin foto)")
        : `Alguien está en la puerta de ${unitResult.label}`;

    await Promise.all(associatedUsers.map(async (u) => {
        if (u.userId) {
            await sendPushNotification(u.userId, title, body, `/dashboard`);
        }
    }));

    // 7. Publish Real-time Event
    const { publishEvent } = await import("@/lib/events");
    await publishEvent(`unit-${unitId}`, {
        type: "RINGING",
        timestamp: Date.now(),
        unitId,
        payload: {
            logId: newLog.id,
            photoUrl,
            message
        }
    });

    return { success: true, message: "Llamando...", logId: newLog.id };

  } catch (error) {
    console.error("Error ringing doorbell:", error);
    return { success: false, message: "Error interno del servidor" };
  }
}
