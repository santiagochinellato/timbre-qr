"use server";

import { db } from "@/db";
import { accessLogs, units, buildings, userUnits } from "@/db/schema";
import { eq, desc, and, gt } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import mqtt from "mqtt";
import { sendPushNotification } from "@/actions/push-actions";

// Simulates the physical hardware button press
// 1. Publishes MQTT "RING" event (Digital Twin echo)
// 2. Inserts Log into DB (Backend processing)
// 3. Sends Push (Backend processing)
export async function simulatePhysicalRing(unitId: string) {
  try {
    // 1. Fetch details
    const unit = await db.query.units.findFirst({
      where: eq(units.id, unitId),
      with: {
        building: true,
      },
    });

    if (!unit) return { success: false, message: "Unit not found" };

    const buildingSlug = unit.building?.slug || "demo-center";
    const topic = `timbre-qr/${buildingSlug}/ring`; // Simulated Topic
    const payload = JSON.stringify({
      type: "RING",
      unit: unit.label,
      timestamp: Date.now(),
    });

    // 2. Publish to MQTT (Fire and Forget)
    // We connect briefly to publish.
    const brokerUrl = process.env.MQTT_BROKER_URL;
    if (brokerUrl) {
      const client = mqtt.connect(brokerUrl, { connectTimeout: 3000 });
      client.on("connect", () => {
        client.publish(topic, payload, { qos: 1 }, () => {
            client.end();
        });
      });
      client.on("error", () => client.end());
    }

    // 3. Backend Logic (Insert Log + Push)
    // (Copying simplified logic from ringDoorbell to ensure it works without formData)
    const [newLog] = await db
      .insert(accessLogs)
      .values({
        unitId: unitId,
        status: "ringing",
        message: "SIMULATED_RING_EVENT",
      })
      .returning();

     // Find Users
    const associatedUsers = await db
        .select({ userId: userUnits.userId })
        .from(userUnits)
        .where(eq(userUnits.unitId, unitId));

    // Send Push
    await Promise.all(associatedUsers.map(async (u) => {
        if (u.userId) {
            await sendPushNotification(
                u.userId,
                "🔔 Simulador de Timbre",
                `Alguien tocó el timbre (Virtual) en ${unit.label}`,
                "/dashboard"
            );
        }
    }));

    revalidatePath("/dashboard/simulator");
    return { success: true, message: "Ring Sent!", logId: newLog.id };

  } catch (error) {
    console.error("Simulation Error:", error);
    return { success: false, message: "Error simulating ring" };
  }
}

// Checks if the specific log has been "opened" recently
// Used by the client to polling the "Lock" status
export async function checkLatestOpenCommand(logId: string) {
    if (!logId) return { open: false };

    const log = await db.query.accessLogs.findFirst({
        where: eq(accessLogs.id, logId),
    });

    if (log && log.status === "opened") {
        return { open: true, opener: "Remote Admin" }; // Simplified
    }
    return { open: false };
}
