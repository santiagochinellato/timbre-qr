
import "dotenv/config";
import { hash } from "bcryptjs";
import { eq, like } from "drizzle-orm";

async function seed() {
  // Dynamic import for db connection with env vars loaded
  const { db } = await import("../db");
  const { users, buildings, units, userUnits, accessLogs } = await import("../db/schema");

  console.log("🌱 Seeding Demo Scenarios...");

  // 1. Clean up existing demo buildings to avoid duplicates (Optional: wipe logs too if needed)
  console.log("🧹 Cleaning old demo data (if exists)...");
  
  // Array of demo slugs to clean
  const demoSlugs = ["demo-center", "demo-cauquen", "demo-ph"];
  
  for (const slug of demoSlugs) {
    const existing = await db.query.buildings.findFirst({ where: eq(buildings.slug, slug) });
    if (existing) {
        console.log(`- Deleting ${existing.name} (${slug})`);
        // Find units for this building to clean logs
        const existingUnits = await db.query.units.findMany({ where: eq(units.buildingId, existing.id) });
        const unitIds = existingUnits.map(u => u.id);
        
        if (unitIds.length > 0) {
             // We can't easily use 'inArray' without importing it, but we imported 'eq' and 'like'.
             // Let's dynamic import 'inArray' or just iterate.
             const { inArray } = await import("drizzle-orm");
             await db.delete(accessLogs).where(inArray(accessLogs.unitId, unitIds));
             await db.delete(userUnits).where(inArray(userUnits.unitId, unitIds));
             await db.delete(units).where(inArray(units.id, unitIds));
        }

        await db.delete(buildings).where(eq(buildings.id, existing.id));
    }
  }

  // Also clean old names just in case they have different slugs
  const oldNames = ["Edificio Demo Center", "Complejo Cauquen", "Cabañas del Bosque", "PH Las Victorias"];
  for (const name of oldNames) {
      const existing = await db.query.buildings.findFirst({ where: eq(buildings.name, name) });
      if (existing) {
          console.log(`- Deleting ${existing.name} by name`);
           // Find units for this building to clean logs
        const existingUnits = await db.query.units.findMany({ where: eq(units.buildingId, existing.id) });
        const unitIds = existingUnits.map(u => u.id);
        
        if (unitIds.length > 0) {
             const { inArray } = await import("drizzle-orm");
             await db.delete(accessLogs).where(inArray(accessLogs.unitId, unitIds));
             await db.delete(userUnits).where(inArray(userUnits.unitId, unitIds));
             await db.delete(units).where(inArray(units.id, unitIds));
        }
          await db.delete(buildings).where(eq(buildings.id, existing.id));
      }
  }


  // 2. Create Main User (if checks fail, but usually we assume user exists or we create a new random one if needed. Let's just create one generic demo user if missing or get first)
  const passwordHash = await hash("123456", 10);
  let mainUser = await db.query.users.findFirst({ where: eq(users.email, "demo@gbellz.com") });
  
  if (!mainUser) {
    console.log("Creating default demo user...");
    [mainUser] = await db
        .insert(users)
        .values({
            name: "Propietario Demo",
            email: "demo@gbellz.com",
            passwordHash,
            role: "user",
            image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=150&q=80",
        })
        .returning();
  }

  // === SCENARIO 1: Cabañas del Bosque (QR Only) ===
  // Slug: /r/demo-center (Requested by user, despite name mismatch)
  console.log("➡️ Creating Cabañas del Bosque...");
  const [cabanas] = await db.insert(buildings).values({
      name: "Cabañas del Bosque",
      slug: "demo-center", // USER REQUESTED SLUG
      mqttTopic: "cabanas/gate",
      cameraUrl: null, // No fixed camera, uses visitor phone
  }).returning();

  // Create 5 units
  const cabanaUnitsData = Array.from({ length: 5 }, (_, i) => ({
      buildingId: cabanas.id,
      label: `Cabaña ${i + 1}`,
      mqttTopic: `cabanas/c${i + 1}/lock`
  }));
  const cabanaUnits = await db.insert(units).values(cabanaUnitsData).returning();


  // === SCENARIO 2: Complejo Cauquén (Totem/Live Camera) ===
  // Slug: /r/demo-cauquen
  console.log("➡️ Creating Complejo Cauquén...");
  const [cauquen] = await db.insert(buildings).values({
      name: "Complejo Cauquén",
      slug: "demo-cauquen",
      mqttTopic: "cauquen/gate",
      // Live feed URL (e.g., public webcam or placeholder)
      cameraUrl: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=2070&auto=format&fit=crop", 
      enableVisitorCamera: false, // TOTEM MODE: No visitor selfie
  }).returning();

  // Create 10 units
  const cauquenLabels = ["1A", "1B", "2A", "2B", "3A", "3B", "4A", "4B", "5A", "5B"];
  const cauquenUnitsData = cauquenLabels.map(label => ({
      buildingId: cauquen.id,
      label: label,
      mqttTopic: null // Uses main entrance only
  }));
  const cauquenUnits = await db.insert(units).values(cauquenUnitsData).returning();


  // === SCENARIO 3: PH Las Victorias (Hybrid) ===
  // Slug: /r/demo-ph
  console.log("➡️ Creating PH Las Victorias...");
  const [ph] = await db.insert(buildings).values({
      name: "PH Las Victorias",
      slug: "demo-ph",
      mqttTopic: "ph/gate",
      cameraUrl: "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?q=80&w=2070&auto=format&fit=crop", // Private cam placeholder
  }).returning();

  // Create 1 Unit
  const [phUnit] = await db.insert(units).values({
      buildingId: ph.id,
      label: "Casa Principal",
      mqttTopic: "ph/house/door"
  }).returning();


  // 3. Link User to ALL Units (Owner role)
  console.log("🔗 Linking user to all units...");
  const allNewUnits = [...cabanaUnits, ...cauquenUnits, phUnit];
  
  const userUnitsData = allNewUnits.map(u => ({
      userId: mainUser.id,
      unitId: u.id,
      role: "owner" as const,
  }));

  await db.insert(userUnits).values(userUnitsData);

  console.log("✅ Seed complete!");
  console.log(`- Cabañas: ${cabanaUnits.length} units (Slug: /r/demo-center)`);
  console.log(`- Cauquén: ${cauquenUnits.length} units (Slug: /r/demo-cauquen)`);
  console.log(`- PH: 1 unit (Slug: /r/demo-ph)`);
}

seed().catch(console.error).finally(() => process.exit(0));
