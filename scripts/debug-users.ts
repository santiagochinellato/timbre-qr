import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
import { db } from "@/db";
import { residents, units } from "@/db/schema";
import { eq } from "drizzle-orm";

async function main() {
  console.log("🔍 Checking Residents...");
  
  const allResidents = await db
    .select({
      name: residents.name,
      phone: residents.phone,
      unit: units.label
    })
    .from(residents)
    .leftJoin(units, eq(residents.unitId, units.id));

  console.log("Found Residents:", JSON.stringify(allResidents, null, 2));
  process.exit(0);
}

main().catch(console.error);
