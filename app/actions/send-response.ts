"use server";

import { db } from "@/db";
import { accessLogs } from "@/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function sendResponse(logId: string, message: string) {
  try {
    if (!logId || !message) {
      return { success: false, error: "Missing required fields" };
    }

    await db
      .update(accessLogs)
      .set({ responseMessage: message })
      .where(eq(accessLogs.id, logId));

    revalidatePath("/dashboard");
    return { success: true };
  } catch (error) {
    console.error("Error sending response:", error);
    return { success: false, error: "Failed to send response" };
  }
}
