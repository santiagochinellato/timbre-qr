import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
import { db } from "@/db";

async function main() {
  console.log("🔍 Checking Users & Units...");
  
  const allUsers = await db.query.users.findMany({
    with: {
        units: {
            with: {
                unit: {
                    with: {
                        building: true
                    }
                }
            }
        }
    }
  });

  console.log("Found Users:", JSON.stringify(allUsers, null, 2));
  process.exit(0);
}

main().catch(console.error);
