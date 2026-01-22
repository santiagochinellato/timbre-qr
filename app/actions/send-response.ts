"use server";

import { db } from "@/db";
import { accessLogs } from "@/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

/**
 * Sends a quick response message to the visitor.
 * Updates the log with the response message and revalidates the dashboard.
 * @param logId UUID of the access log entry
 * @param message Message to send (e.g. "Ya bajo")
 */
export async function sendResponse(logId: string, message: string) {
  try {
    if (!logId || !message) {
      return { success: false, error: "Missing required fields" };
    }

    const [updatedLog] = await db
      .update(accessLogs)
      .set({ responseMessage: message })
      .where(eq(accessLogs.id, logId))
      .returning({ unitId: accessLogs.unitId });

    if (updatedLog) {
        const { publishEvent } = await import("@/lib/events");
        await publishEvent(`unit-${updatedLog.unitId}`, {
            type: "RESPONSE_SENT",
            timestamp: Date.now(),
            unitId: updatedLog.unitId,
            payload: { logId, message }
        });
    }

    revalidatePath("/dashboard");
    return { success: true };
  } catch (error) {
    console.error("Error sending response:", error);
    return { success: false, error: "Failed to send response" };
  }
}
