"use server";

import { createAccessLog, getResidentsByUnit } from "@/lib/dal";
import { WhatsAppClient } from "@/lib/whatsapp/client";
import { uploadVisitorSelfie } from "@/lib/storage/upload";

export async function ringDoorbell(prevState: any, formData: FormData) {
    const unit = formData.get("unit") as string;
    const imageFile = formData.get("image") as File;

    if (!unit || !imageFile) {
        return { success: false, message: "Missing unit or photo" };
    }

    // Basic validation
    if (imageFile.size > 5 * 1024 * 1024) {
        return { success: false, message: "Photo too large (max 5MB)" };
    }

    try {
        // Parallel Execution: Upload Image + Fetch Residents
        const [publicUrl, residents] = await Promise.all([
            uploadVisitorSelfie(imageFile),
            getResidentsByUnit(unit, "default-building")
        ]);

        if (residents.length === 0) {
            return { success: false, message: "Unit not found or no residents active." };
        }

        // We assume all residents belong to the same unitId if grouped by label
        const unitId = residents[0].unitId;

        // 2. Create Audit Log with REAL public URL
        const logs = await createAccessLog({
            unitId: unitId,
            visitorPhotoUrl: publicUrl,
            status: 'ringing'
        });

        const logId = logs[0].id;

        console.log(`Ringing ${residents.length} residents for unit ${unit} with image ${publicUrl}`);

        // 3. Send WhatsApp via Graph API
        const waClient = WhatsAppClient.getInstance();

        await Promise.all(residents.map(async (resident) => {
            if (!resident.phone) return;

            await waClient.sendAccessAlert(
                resident.phone,
                "Visita",
                unit,
                publicUrl, // Now a valid R2 public URL
                logId
            );
        }));

        return { success: true, message: `Ringing Unit ${unit}!` };
    } catch (error) {
        console.error("Ring Error:", error);
        return { success: false, message: "Failed to ring doorbell." };
    }
}
