"use server";

import { db } from "@/db";
import { accessLogs, residents, units } from "@/db/schema";
import { eq } from "drizzle-orm";
import { WhatsAppClient } from "@/lib/whatsapp/client";
// import { uploadVisitorSelfie } from '@/lib/storage/upload'; // 👈 COMENTADO TEMPORALMENTE

export async function ringDoorbell(prevState: any, formData: FormData) {
    const unitLabel = formData.get("unit") as string;
    const imageFile = formData.get("image") as File;

    // 1. Validation
    if (!unitLabel) {
        return { success: false, message: "Missing unit" };
    }

    // ⚡ BYPASS DE R2 (Truco para probar sin Cloudflare)
    // En lugar de subir la foto, usamos una URL de prueba que Meta acepte.
    // Cuando tengas R2 configurado, descomenta la línea de abajo y borra la URL fija.
    
    // const photoUrl = await uploadVisitorSelfie(imageFile); 
    const photoUrl = "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=800&q=80"; // 📸 FOTO FALSA (Avatar genérico)

    try {
        // 2. Lookup Unit ID from Label (Needed because frontend sends "101" etc, not UUID)
        const unitResult = await db.select().from(units).where(eq(units.label, unitLabel)).limit(1);
        
        if (!unitResult.length) {
            return { success: false, message: "Unit not found" };
        }
        
        const unitId = unitResult[0].id;

        // 3. Buscamos los residentes de esa unidad
        const activeResidents = await db
            .select()
            .from(residents)
            .where(eq(residents.unitId, unitId));

        if (activeResidents.length === 0) {
            return { success: false, message: "No hay residentes en esta unidad." };
        }

        // 4. Creamos el Log en la DB y enviamos WhatsApps (Paralelo)
        // Primero insertamos el log para tener el ID
        const [newLog] = await db
            .insert(accessLogs)
            .values({
                unitId,
                visitorPhotoUrl: photoUrl,
                status: "ringing",
            })
            .returning();

        // Ahora enviamos los mensajes a todos los residentes
        const whatsappClient = WhatsAppClient.getInstance();
        
        await Promise.all(
            activeResidents.map((resident) =>
                whatsappClient.sendAccessAlert(
                    resident.phone,
                    resident.name,
                    unitLabel,
                    photoUrl,
                    newLog.id // 🔑 Importante: El ID del log para el botón "Abrir"
                )
            )
        );

        return { success: true, message: "Timbre tocado" };
    } catch (error) {
        console.error("Error ringing doorbell:", error);
        return { success: false, message: "Error interno del servidor" };
    }
}
