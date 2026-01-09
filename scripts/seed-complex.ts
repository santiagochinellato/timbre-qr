import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
// import { db } from "../db"; // Removed static import
// import { users, buildings, units, userUnits } from "../db/schema"; // Removed static import
import { hash } from "bcryptjs";

async function seed() {
  // Dynamic import to ensure env vars are loaded first
  const { db } = await import("../db");
  const { users, buildings, units, userUnits } = await import("../db/schema");
  
  console.log("🌱 Seeding complex data...");

  // 1. Create Main User
  const passwordHash = await hash("123456", 10);
  const [mainUser] = await db
    .insert(users)
    .values({
      name: "Propietario Demo",
      email: "demo@gbellz.com", // Changed to match previous demo logic if needed, or keeping explicit
      passwordHash,
      role: "user",
      image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=150&q=80",
    })
    .returning();

  console.log("👤 User created:", mainUser.email);

  // 2. Property 1: PH Las Victorias
  const [phBuilding] = await db
    .insert(buildings)
    .values({
      name: "PH Las Victorias",
      slug: "ph-las-victorias",
      mqttTopic: "ph/victorias/gate", // Main gate
    })
    .returning();

  const [phUnit] = await db
    .insert(units)
    .values({
      buildingId: phBuilding.id,
      label: "Principal",
      mqttTopic: "ph/victorias/door", // Specific door
    })
    .returning();

  // 3. Property 2: Edificio Center (5 Units)
  const [apartmentBuilding] = await db
    .insert(buildings)
    .values({
      name: "Edificio Demo Center",
      slug: "demo-center", // Restored requested slug
      mqttTopic: "center/gate",
    })
    .returning();

  const aptLabels = ["1B", "2C", "3D", "5B", "9A"];
  const aptUnits = await db
    .insert(units)
    .values(
      aptLabels.map((label) => ({
        buildingId: apartmentBuilding.id,
        label,
        // Units in a building might NOT have their own mqttTopic if they only use the main gate
        // But let's give 9A one to test
        mqttTopic: label === "9A" ? "center/9a/lock" : null,
      }))
    )
    .returning();

  // 4. Property 3: Cabañas del Bosque
  const [cabanasBuilding] = await db
    .insert(buildings)
    .values({
      name: "Cabañas del Bosque",
      slug: "cabanas-bosque",
      mqttTopic: "cabanas/gate",
    })
    .returning();

  const cabanaLabels = ["Cabaña 1", "Cabaña 2", "Cabaña 3"];
  const cabanaUnits = await db
    .insert(units)
    .values(
      cabanaLabels.map((label) => ({
        buildingId: cabanasBuilding.id,
        label,
        mqttTopic: `cabanas/${label.replace(" ", "").toLowerCase()}/lock`, // All cabins have locks
      }))
    )
    .returning();

  // 5. Link User to ALL Units
  const allUnits = [phUnit, ...aptUnits, ...cabanaUnits];
  const userUnitsData = allUnits.map((u) => ({
    userId: mainUser.id,
    unitId: u.id,
    role: "owner" as const, // Fix type error
  }));

  await db.insert(userUnits).values(userUnitsData);

  console.log(`✅ Seeded 3 buildings and ${allUnits.length} units.`);
}

seed()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    process.exit(0);
  });
