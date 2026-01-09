import "dotenv/config";
import { db } from "../db";
import { pushSubscriptions, users, userUnits, units } from "../db/schema";
import { eq } from "drizzle-orm";

async function main() {
  console.log("🔍 Checking Push Subscriptions & Links...");

  // 1. Check Users
  const allUsers = await db.select().from(users);
  console.log(`👤 Users found: ${allUsers.length}`);
  allUsers.forEach(u => console.log(`   - ${u.email} (${u.id})`));

  // 2. Check Subscriptions
  const allSubs = await db.select().from(pushSubscriptions);
  console.log(`🔔 Subscriptions found: ${allSubs.length}`);
  allSubs.forEach(s => console.log(`   - User: ${s.userId} | Endpoint: ${s.endpoint.substring(0, 20)}...`));

  // 3. Check Units & Links
  const allUnits = await db.select().from(units);
  console.log(`🚪 Units found: ${allUnits.length}`);
  
  for (const unit of allUnits) {
      const links = await db.select().from(userUnits).where(eq(userUnits.unitId, unit.id));
      console.log(`   - Unit ${unit.label} (${unit.id}) has ${links.length} linked users.`);
      links.forEach(l => console.log(`     -> Linked User: ${l.userId}`));
  }

  process.exit(0);
}

main();
