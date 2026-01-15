"use server";

import { db } from "@/db";
import { accessLogs } from "@/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function rejectCall(logId: string) {
  try {
    await db
      .update(accessLogs)
      .set({ status: "rejected" })
      .where(eq(accessLogs.id, logId));

    revalidatePath("/dashboard");
    return { success: true };
  } catch (error) {
    console.error("Error rejecting call:", error);
    return { success: false, message: "Error al rechazar la llamada" };
  }
}
