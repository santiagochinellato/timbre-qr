import { db } from "@/db";
import { units, accessLogs } from "@/db/schema";
import { desc, eq } from "drizzle-orm";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

async function main() {
  console.log("🔍 Checking Units...");
  const allUnits = await db.query.units.findMany({
      with: { building: true }
  });
  
  allUnits.forEach(u => {
      console.log(`- [${u.id}] ${u.building.name} - Unit ${u.label} (Slug: ${u.slug})`);
  });

  console.log("\n🔍 Checking Recent Logs (Last 5)...");
  const recentLogs = await db.select().from(accessLogs).orderBy(desc(accessLogs.createdAt)).limit(5);
  
  recentLogs.forEach(l => {
      console.log(`- [${l.createdAt}] Unit: ${l.unitId} | Status: ${l.status} | ID: ${l.id}`);
  });
}

main().catch(console.error);
