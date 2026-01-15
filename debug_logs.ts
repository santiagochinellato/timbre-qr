
import { db } from "./db";
import { units, buildings } from "./db/schema";
import { eq, and } from "drizzle-orm";

async function debugUnit() {
  // Find "Edificio Demo Center"
  const building = await db.query.buildings.findFirst({
      where: eq(buildings.slug, "demo-center") // Guessing slug from seed 'demo-center'
  });

  if (!building) {
      console.log("Building 'demo-center' not found. Searching by name...");
      const b2 = await db.query.buildings.findFirst({
          where: eq(buildings.name, "Edificio Demo Center")
      });
      if(b2) console.log("Found by name:", b2.id);
      else { console.log("Building not found"); process.exit(1); }
      
      // Use this building
      const u = await db.query.units.findFirst({
          where: and(
              eq(units.buildingId, b2.id),
              eq(units.label, "1B")
          )
      });
      if(u) {
          dumpLogs(u.id);
      } else {
          console.log("Unit 1B not found in Demo Center");
      }
      return;
  }

  console.log("Building found:", building.id);
  const u = await db.query.units.findFirst({
      where: and(
          eq(units.buildingId, building.id),
          eq(units.label, "1B")
      )
  });
  
  if (u) {
      console.log("Unit 1B ID:", u.id);
      dumpLogs(u.id);
  } else {
      console.log("Unit 1B not found");
      // List all units
      const all = await db.query.units.findMany({ where: eq(units.buildingId, building.id) });
      console.log("Available units:", all.map(x => x.label));
  }
}

async function dumpLogs(unitId: string) {
    const { accessLogs } = await import("./db/schema");
    const { desc, eq } = await import("drizzle-orm");
    
    const logs = await db.query.accessLogs.findMany({
        where: eq(accessLogs.unitId, unitId),
        orderBy: [desc(accessLogs.createdAt)],
        limit: 5
    });

    console.log("--- LATEST 5 LOGS ---");
    logs.forEach(l => {
        console.log(`[${l.createdAt}] Status: ${l.status}, Msg: "${l.message}", Photo: ${l.visitorPhotoUrl}`);
    });
    process.exit(0);
}

debugUnit();
