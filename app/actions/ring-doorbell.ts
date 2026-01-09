"use server";

import { db } from "@/db";
import { accessLogs, userUnits } from "@/db/schema";
import { eq } from "drizzle-orm";
// import { uploadVisitorSelfie } from '@/lib/storage/upload'; 
import { sendPushNotification } from "@/actions/push-actions";

export async function ringDoorbell(prevState: any, formData: FormData) {
    // prompt said "Input: unitId (or slug)". But schema only has slug on buildings.
    // We assume the form will send the unit's UUID as 'unitId' or 'slug' field.
    const imageFile = formData.get("image") as File;
    const unitId = (formData.get("slug") || formData.get("unit")) as string;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    let photoUrl = "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=800&q=80"; // Fallback

    if (imageFile && imageFile.size > 0) {
        try {
            const { saveLocalFile } = await import("@/lib/storage/upload-local");
            photoUrl = await saveLocalFile(imageFile);
        } catch (error) {
            console.error("❌ Failed to save image:", error);
        }
    }

    try {
        const unitResult = await db.query.units.findFirst({
            where: (u, { eq }) => eq(u.id, unitId)
        });
        
        if (!unitResult) {
            return { success: false, message: "Unit not found" };
        }
        
        // const unitId = unitResult.id; // Already have it

        // Insert Log
        const [newLog] = await db
            .insert(accessLogs)
            .values({
                unitId: unitId,
                visitorPhotoUrl: photoUrl,
                status: "ringing",
            })
            .returning();

        // Find associated users (owners/residents)
        // Previous schema used 'residents' table. New schema uses 'userUnits' table linking to 'users'.
        const associatedUsers = await db
            .select({ userId: userUnits.userId })
            .from(userUnits)
            .where(eq(userUnits.unitId, unitId));

        if (associatedUsers.length === 0) {
            // Logged but no ones to notify
            return { success: true, message: "Timbre tocado (Sin residentes activos)" };
        }

        // Send Push Notifications
        const notificationPromises = associatedUsers.map(async (u) => {
            if (u.userId) {
                await sendPushNotification(
                    u.userId,
                    "Timbre Tocado",
                    "Alguien está en la puerta",
                    `/dashboard`
                );
            }
        });

        await Promise.all(notificationPromises);

        return { success: true, message: "Timbre tocado" };
    } catch (error) {
        console.error("Error ringing doorbell:", error);
        return { success: false, message: "Error interno del servidor" };
    }
}
