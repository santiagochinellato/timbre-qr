import "dotenv/config";
import { db } from "../../db";
import { accessLogs, units, buildings } from "../../db/schema";
import { eq, desc } from "drizzle-orm";

async function checkLogs() {
  console.log("🔍 Checking recent access logs for 'demo-center' (Cabañas)...");
  
  const result = await db.select({
      id: accessLogs.id,
      unit: units.label,
      building: buildings.name,
      photo: accessLogs.visitorPhotoUrl,
      msg: accessLogs.message,
      createdAt: accessLogs.createdAt
  })
  .from(accessLogs)
  .innerJoin(units, eq(accessLogs.unitId, units.id))
  .innerJoin(buildings, eq(units.buildingId, buildings.id))
  .where(eq(buildings.slug, "demo-ph"))
  .orderBy(desc(accessLogs.createdAt))
  .limit(5);

  console.log(JSON.stringify(result, null, 2));
  process.exit(0);
}
checkLogs().catch(console.error);
