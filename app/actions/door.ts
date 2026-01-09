"use server";

import { auth } from "@/lib/auth";
import { db } from "@/db";
import { accessLogs, userUnits } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function openDoor(logId: string, target: "building" | "unit" | "default" = "default") {
    const session = await auth();
    if (!session?.user?.id) return { success: false, message: "Unauthorized" };

    try {
        // 1. Get log to find unitId
        const log = await db.query.accessLogs.findFirst({
            where: eq(accessLogs.id, logId)
        });

        if (!log || !log.unitId) return { success: false, message: "Log not found" };

        // 2. Verify user has access to this unit
        const hasAccess = await db.query.userUnits.findFirst({
            where: and(
                eq(userUnits.userId, session.user.id),
                eq(userUnits.unitId, log.unitId)
            )
        });

        if (!hasAccess) return { success: false, message: "Forbidden" };

        // 3. Update log status
        await db.update(accessLogs)
            .set({ status: "opened", openedByUserId: session.user.id })
            .where(eq(accessLogs.id, logId));

        // TO DO: Send MQTT Command or similar to actually open door
        // console.log(`Opening door for unit ${log.unitId}`);

        revalidatePath(`/properties/${log.unitId}`);
        return { success: true };
    } catch (error) {
        console.error("Error opening door:", error);
        return { success: false, message: "Server error" };
    }
}
