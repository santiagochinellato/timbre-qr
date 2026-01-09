// scripts/seed.ts
import "dotenv/config";
import { db } from "../db";
import { users, buildings, units, userUnits } from "../db/schema";
import { hash } from "bcryptjs";

async function main() {
  console.log("🌱 Iniciando Carga de Datos (Seed)...");

  // 1. Limpiar datos viejos (Opcional, ten cuidado en prod)
  // await db.delete(userUnits);
  // await db.delete(units);
  // await db.delete(buildings);
  // await db.delete(users);

  // 2. Crear Edificio
  const [newBuilding] = await db.insert(buildings).values({
    name: "Edificio Demo Center",
    slug: "demo-center",
    mqttTopic: "bellz/demo-center",
  }).returning();

  console.log("🏢 Edificio creado:", newBuilding.name);

  // 3. Crear Unidad (El timbre escaneará el código de esta unidad)
  const [newUnit] = await db.insert(units).values({
    buildingId: newBuilding.id,
    label: "4B", // Unidad 4B
  }).returning();

  console.log("🚪 Unidad creada:", newUnit.label, "| ID:", newUnit.id);

  // 4. Crear Usuario Propietario (Login: admin@test.com / 123456)
  const passwordHash = await hash("123456", 10);
  const [newUser] = await db.insert(users).values({
    email: "admin@test.com",
    name: "Santiago Propietario",
    passwordHash: passwordHash,
    role: "user", // Rol de sistema
  }).returning();

  console.log("👤 Usuario creado:", newUser.email);

  // 5. Vincular Usuario a la Unidad (Darle permisos de dueño)
  await db.insert(userUnits).values({
    userId: newUser.id,
    unitId: newUnit.id,
    role: "owner",
  });

  console.log("🔗 Vinculación exitosa: Santiago es dueño de la 4B");
  
  // Imprimir URL para probar
  console.log("\n🧪 URL PARA EL VISITANTE (TIMBRE):");
  // La ruta espera el SLUG del edificio, no el ID de la unidad
  console.log(`URL_PATH: /r/${newBuilding.slug}`);
  
  process.exit(0);
}

main().catch((err) => {
  console.error("❌ Error en seed:", err);
  process.exit(1);
});
