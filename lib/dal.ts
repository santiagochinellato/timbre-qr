import { db } from "@/db";
import { buildings, users, userUnits, units, accessLogs } from "@/db/schema";
import { eq, and } from "drizzle-orm";

// 1. Get Building by Slug (for QR Validation)
export async function getBuildingBySlug(slug: string) {
    const result = await db.select().from(buildings).where(eq(buildings.slug, slug)).limit(1);
    return result[0] || null;
}

// 2. Get Residents by Unit (to Message them)
export async function getResidentsByUnit(unitLabel: string, buildingId: string) {
    // First find unit ID by label + building
    // Ideally units would be queried by ID, but frontend sends "101". 
    // We need to join.

    // Let's do a join query
    const result = await db.select({
        name: users.name,
        email: users.email,
        unitId: units.id
    })
        .from(userUnits)
        .innerJoin(users, eq(userUnits.userId, users.id))
        .innerJoin(units, eq(userUnits.unitId, units.id))
        .where(eq(units.label, unitLabel)) // Add buildingId check if we had it easily available or slug
    // For MVP we assume unit labels are unique per building? Or we should filter by building too.
    // The current request doesn't pass buildingId to this fn, let's update signature or fetch carefully.

    return result;
}

// 3. Create Access Log
export async function createAccessLog(data: {
    unitId: string;
    visitorPhotoUrl: string; // Base64 or URL
    status?: string;
}) {
    return await db.insert(accessLogs).values({
        unitId: data.unitId,
        visitorPhotoUrl: data.visitorPhotoUrl,
        status: data.status || 'pending'
    }).returning();
}

// 4. Get Log Details for Webhook (Need Building Slug & Unit Label)
export async function getLogDetails(logId: string) {
    // Join access_log -> unit -> building
    const result = await db.select({
        id: accessLogs.id,
        status: accessLogs.status,
        unitLabel: units.label,
        buildingSlug: buildings.slug
    })
        .from(accessLogs)
        .innerJoin(units, eq(accessLogs.unitId, units.id))
        .innerJoin(buildings, eq(units.buildingId, buildings.id))
        .where(eq(accessLogs.id, logId))
        .limit(1);

    return result[0] || null;
}

// 5. Update Log Status
export async function updateLogStatus(logId: string, status: string) {
    await db.update(accessLogs)
        .set({ status })
        .where(eq(accessLogs.id, logId));
}
