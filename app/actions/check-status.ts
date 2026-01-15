"use server";

import { db } from "@/db";
import { accessLogs } from "@/db/schema";
import { eq, desc } from "drizzle-orm";

export async function checkUnitStatus(unitId: string) {
  try {
    // 1. Fetch the latest RINGING log (active)
    const ringingLog = await db.query.accessLogs.findFirst({
      where: (logs, { eq, and }) => and(
          eq(logs.unitId, unitId),
          eq(logs.status, "ringing")
      ),
      orderBy: [desc(accessLogs.createdAt)],
    });

    if (ringingLog) {
        const now = new Date();
        const logTime = new Date(ringingLog.createdAt || now);
        const ageInMs = now.getTime() - logTime.getTime();
        const TWO_MINUTES = 2 * 60 * 1000;

        // 2. Check Age
        if (ageInMs > TWO_MINUTES) {
            // STALE RING: Cleanup immediately
            console.log(`[CheckStatus] Auto-expiring stale ring ${ringingLog.id} (Age: ${Math.round(ageInMs/1000)}s)`);
            
            await db.update(accessLogs)
                .set({ status: 'missed' })
                .where(eq(accessLogs.id, ringingLog.id));

            return { isRinging: false, log: null };
        }

        // 3. Valid Ring
        return { isRinging: true, log: ringingLog };
    }

    // Fallback: Check if the LATEST log is relevant (even if not ringing, to show status?)
    // But for "Active Door", we only care about ringing.
    
    return { isRinging: false, log: null };
  } catch (error) {
    console.error("Error checking unit status:", error);
    return { isRinging: false, log: null };
  }
}

export async function checkCallStatus(logId: string) {
    if (!logId) return { success: false };

    try {
        const log = await db.query.accessLogs.findFirst({
            where: eq(accessLogs.id, logId),
            columns: { status: true, responseMessage: true }
        });

        if (!log) return { success: false, status: null };

        return { success: true, status: log.status, responseMessage: log.responseMessage };
    } catch (error) {
        console.error("Error checking call status:", error);
        return { success: false, status: null };
    }
}
