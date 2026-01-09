import "dotenv/config";
import { db } from "../db";
import { sql } from "drizzle-orm";

async function main() {
  console.log("🔧 Agregando columna email_digest...");
  
  try {
      await db.execute(sql`
        ALTER TABLE "user" 
        ADD COLUMN IF NOT EXISTS email_digest boolean DEFAULT true;
      `);
      console.log("✅ Columna email_digest agregada.");
      process.exit(0);
  } catch (err) {
      console.error("❌ Error:", err);
      process.exit(1);
  }
}

main();
