"use server";

import { db } from "@/db";
import { accessLogs } from "@/db/schema";
import { eq, desc } from "drizzle-orm";

export async function checkUnitStatus(unitId: string) {
  try {
    // Look for any 'ringing' log from the last 10 minutes (increased window for safety)
    const timeWindow = new Date(Date.now() - 10 * 60 * 1000); 

    const ringingLog = await db.query.accessLogs.findFirst({
      where: (logs, { eq, and, gt }) => and(
          eq(logs.unitId, unitId),
          eq(logs.status, "ringing"),
          gt(logs.createdAt, timeWindow)
      ),
      orderBy: [desc(accessLogs.createdAt)],
    });

    // Debugging
    // console.log(`[CheckStatus] Unit ${unitId}: Found ringing?`, !!ringingLog);

    if (ringingLog) {
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
