"use server";

import { db } from "@/db";
import { accessLogs } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function checkCallStatus(logId: string) {
    if (!logId) return { success: false };

    try {
        const log = await db.query.accessLogs.findFirst({
            where: eq(accessLogs.id, logId),
            columns: { status: true }
        });

        if (!log) return { success: false, status: null };

        return { success: true, status: log.status };
    } catch (error) {
        console.error("Error checking call status:", error);
        return { success: false, status: null };
    }
}
