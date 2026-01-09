import "dotenv/config";
import { db } from "../db";
import { users, buildings, units, userUnits } from "../db/schema";
import { hash } from "bcryptjs";

async function main() {
  console.log("🌱 Iniciando Seed...");

  try {
      // 1. Crear Edificio
      const [newBuilding] = await db.insert(buildings).values({
        name: "Edificio Demo",
        slug: "demo-building",
        mqttTopic: "bellz/demo",
      }).returning();

      if (!newBuilding) throw new Error("Failed to create building");

      console.log("🏢 Edificio creado:", newBuilding.name);

      // 2. Crear Unidad
      const [newUnit] = await db.insert(units).values({
        buildingId: newBuilding.id,
        label: "101",
      }).returning();
      
      if (!newUnit) throw new Error("Failed to create unit");

      console.log("🚪 Unidad creada:", newUnit.label);

      // 3. Crear Usuario (Password: admin123)
      const passwordHash = await hash("admin123", 10);
      const [newUser] = await db.insert(users).values({
        email: "admin@bellz.com",
        name: "Admin Propietario",
        passwordHash: passwordHash,
        role: "admin",
      }).returning();
      
      if (!newUser) throw new Error("Failed to create user");

      console.log("👤 Usuario creado:", newUser.email);

      // 4. Vincular Usuario a Unidad (Como dueño)
      await db.insert(userUnits).values({
        userId: newUser.id,
        unitId: newUnit.id,
        role: "owner",
      });

      console.log("🔗 Usuario vinculado a la unidad 101");
      console.log("✅ Seed completado con éxito.");
      process.exit(0);
  } catch (err) {
      console.error("❌ Error en seed:", err);
      process.exit(1);
  }
}

main().catch((err) => {
  console.error("❌ Error en main seed execution:", err);
  process.exit(1);
});
