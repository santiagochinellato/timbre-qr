"use server";

import { db } from "@/db";
import { accessLogs, userUnits } from "@/db/schema";
import { eq } from "drizzle-orm";
// import { uploadVisitorSelfie } from '@/lib/storage/upload'; 
import { sendPushNotification } from "@/actions/push-actions";

// Rate limiting constraints moved to Redis logic
// const NOTIFICATION_LIMIT = 3; 
// const NOTIFICATION_WINDOW = 60 * 1000;

export async function ringDoorbell(prevState: any, formData: FormData) {
    const imageFile = formData.get("image") as File;
    const unitId = (formData.get("slug") || formData.get("unit")) as string;
    const message = formData.get("message") as string;
    
    let photoUrl = null;

    // 1. Image Handling
    console.log(`[RingDoorbell] Received ring request for unit ${unitId}`);
    
    // Log all keys
    const keys = Array.from(formData.keys());
    console.log(`[RingDoorbell] FormData Keys: ${keys.join(", ")}`);

    const imageEntry = formData.get("image");
    console.log(`[RingDoorbell] Image Entry Type: ${typeof imageEntry}, Is File? ${imageEntry instanceof File}`);

    if (imageEntry instanceof File) {
        console.log(`[RingDoorbell] File details: name=${imageEntry.name}, size=${imageEntry.size}, type=${imageEntry.type}`);
        
        if (imageEntry.size > 0) {
            try {
                console.log("[RingDoorbell] Attempting upload...");
                const { uploadFile } = await import("@/lib/storage");
                photoUrl = await uploadFile(imageEntry);
                console.log(`[RingDoorbell] Upload success. URL: ${photoUrl}`);
            } catch (error) {
                console.error("❌ Failed to save image:", error);
            }
        } else {
             console.warn("[RingDoorbell] File size is 0");
        }
    } else {
        console.warn("[RingDoorbell] 'image' is not a File instance");
    }

    try {
        const unitResult = await db.query.units.findFirst({
            where: (u, { eq }) => eq(u.id, unitId)
        });
        
        if (!unitResult) {
            return { success: false, message: "Unit not found" };
        }


        // 2. Anti-Spam / Rate Limiting (Redis Optimized)
        const { checkRateLimit } = await import("@/lib/rate-limit");
        
        // Limit: 5 requests per 60 seconds per Unit
        const limitResult = await checkRateLimit(unitId, 5, 60);

        if (!limitResult.success) {
             console.warn(`Rate limit exceeded for unit ${unitResult.label}`);
             return { success: false, message: "Espere un momento antes de volver a llamar." };
        }


        // 3. Insert Log
        const [newLog] = await db
            .insert(accessLogs)
            .values({
                unitId: unitId,
                visitorPhotoUrl: photoUrl,
                message: message || null, // Store the fallback message
                status: "ringing",
            })
            .returning();

        // 4. Find Associated Users
        const associatedUsers = await db
            .select({ userId: userUnits.userId })
            .from(userUnits)
            .where(eq(userUnits.unitId, unitId));

        if (associatedUsers.length === 0) {
            return { success: true, message: "Timbre tocado (Sin residentes activos)" };
        }

        // 5. Build Notification Content
        let title = "Timbre Tocado";
        let body = `Alguien está en la puerta de ${unitResult.label}`;
        
        if (!photoUrl) {
            title = "⚠️ Alerta: Timbre sin cámara";
            body = message 
                ? `Mensaje del visitante:\n"${message}"` 
                : "Alguien tocó el timbre pero no compartió imagen.";
        }

        // 6. Send Push Notifications
        const notificationPromises = associatedUsers.map(async (u) => {
            if (u.userId) {
                await sendPushNotification(
                    u.userId,
                    title,
                    body,
                    `/dashboard`
                );
            }
        });

        await Promise.all(notificationPromises);

        return { success: true, message: "Llamando...", logId: newLog.id };
    } catch (error) {
        console.error("Error ringing doorbell:", error);
        return { success: false, message: "Error interno del servidor" };
    }
}
