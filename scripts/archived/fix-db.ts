import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
// import { db } from "../../db";
import { sql } from "drizzle-orm";

async function main() {
  const { db } = await import("../../db");
  console.log("🔥 RESET TOTAL DE LA BASE DE DATOS...");
  
  try {
      // Drop tables in reverse order of dependencies
      await db.execute(sql`DROP TABLE IF EXISTS access_logs CASCADE`);
      await db.execute(sql`DROP TABLE IF EXISTS push_subscriptions CASCADE`);
      await db.execute(sql`DROP TABLE IF EXISTS user_units CASCADE`);
      await db.execute(sql`DROP TABLE IF EXISTS units CASCADE`);
      await db.execute(sql`DROP TABLE IF EXISTS buildings CASCADE`);
      await db.execute(sql`DROP TABLE IF EXISTS "user" CASCADE`); // Note "user" is reserved, Drizzle uses "user"

      console.log("✅ Todas las tablas eliminadas.");
      console.log("Ahora ejecuta 'npx drizzle-kit push' y luego 'npx tsx scripts/seed.ts'");
      process.exit(0);
  } catch (err) {
      console.error("❌ Error:", err);
      process.exit(1);
  }
}

main();
